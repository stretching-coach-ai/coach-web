from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import uuid4
from fastapi import HTTPException
from passlib.hash import bcrypt

from app.core.database import MongoManager
from app.services.user_service import UserService
from app.schemas.user import UserResponse

class AuthService:
    def __init__(self):
        self.user_service = UserService()
        self.sessions = MongoManager.get_db().sessions

    async def initialize_indexes(self):
        """세션 컬렉션에 필요한 인덱스 생성"""
        await self.sessions.create_index("session_id", unique=True)
        await self.sessions.create_index("expires_at", expireAfterSeconds=0)

    async def register(self, email: str, password: str, name: Optional[str] = None, session_id: Optional[str] = None) -> UserResponse:
        # 1. 이메일 중복 체크
        existing_user = await self.user_service.get_user_by_email(email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        # 2. 사용자 생성
        user_data = {
            "email": email,
            "password": bcrypt.hash(password),
            "created_at": datetime.utcnow()
        }
        
        # name이 제공된 경우 추가
        if name:
            user_data["name"] = name
        
        # 3. 사용자 생성 (기존 UserService 활용)
        user_id = await self.user_service.create_user(user_data, session_id)
        return await self.user_service.get_user(user_id)

    async def login(self, email: str, password: str, old_session_id: Optional[str] = None) -> Tuple[UserResponse, str]:
        # 1. 사용자 조회
        user = await self.user_service.get_user_by_email(email, include_password=True)
        if not user or not bcrypt.verify(password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # 2. 새 세션 생성
        new_session_id = str(uuid4())
        session_data = {
            "session_id": new_session_id,
            "user_id": str(user["id"]),
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=24)
        }
        await self.sessions.insert_one(session_data)

        # 3. 기존 세션이 있다면 삭제
        if old_session_id:
            await self.logout(old_session_id)

        # 4. UserResponse 형태로 변환하여 반환
        user_response = await self.user_service.get_user(str(user["id"]))
        return user_response, new_session_id

    async def validate_session(self, session_id: str) -> Optional[UserResponse]:
        if not session_id:
            return None
            
        session = await self.sessions.find_one({
            "session_id": session_id,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not session:
            return None
            
        return await self.user_service.get_user(session["user_id"])

    async def logout(self, session_id: str):
        await self.sessions.delete_one({"session_id": session_id}) 