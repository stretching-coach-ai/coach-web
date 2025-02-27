from app.core.database import MongoManager
from app.models.user import UserDB
from app.schemas.user import UserResponse, UserProfileUpdate, UserCreate
from app.services.temp_session_service import TempSessionService
from bson import ObjectId
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserService:
    def __init__(self):
        self.collection = MongoManager.get_db().users
        self.temp_session_service = TempSessionService()

    async def create_user(self, user_data: UserCreate, session_id: str = None) -> str:
        """회원가입 (비회원 데이터가 있다면 연동)"""
        # 1. 기본 사용자 데이터로 계정 생성
        user = UserDB(**user_data.model_dump())
        user_dict = user.model_dump(exclude={"id"})
        result = await self.collection.insert_one(user_dict)
        user_id = str(result.inserted_id)

        # 2. 임시 세션 데이터 마이그레이션 (스트레칭 히스토리만 저장)
        if session_id:
            temp_session = await self.temp_session_service.get_session(session_id)
            if temp_session and temp_session.stretching_sessions:
                # 스트레칭 히스토리 저장
                await self.collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$push": {
                            "stretching_history": {
                                "$each": [session.model_dump() for session in temp_session.stretching_sessions]
                            }
                        }
                    }
                )
                
                # 임시 세션 삭제
                await self.temp_session_service.delete_session(session_id)

        return user_id

    async def get_user(self, user_id: str) -> Optional[UserResponse]:
        """사용자 조회 (비밀번호 제외)"""
        user = await self.collection.find_one({"_id": ObjectId(user_id)}, {"password": 0})
        if user:
            user["id"] = str(user.pop("_id"))
            return UserResponse(**user)
        return None

    async def update_user_profile(self, user_id: str, update_data: UserProfileUpdate) -> Optional[UserResponse]:
        """사용자 기본 정보 업데이트"""
        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            return await self.get_user(user_id)
            
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)}, {"$set": update_dict}
        )
        if result.modified_count == 0:
            return None
        return await self.get_user(user_id)

    async def delete_user(self, user_id: str) -> bool:
        """사용자 계정 삭제"""
        result = await self.collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0

    async def add_stretching_session(self, user_id: str, stretching_session: dict) -> Optional[UserResponse]:
        """스트레칭 세션 추가"""
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"stretching_history": stretching_session}}
        )
        if result.modified_count == 0:
            return None
        return await self.get_user(user_id)

    async def get_stretching_history(self, user_id: str, limit: int = 10, skip: int = 0) -> List[Dict[str, Any]]:
        """스트레칭 히스토리 조회"""
        user = await self.collection.find_one(
            {"_id": ObjectId(user_id)},
            {"stretching_history": {"$slice": [skip, limit]}}
        )
        if not user:
            return []
        return user.get("stretching_history", [])

    async def get_user_by_email(self, email: str, include_password: bool = False) -> Optional[dict]:
        """이메일로 사용자 조회"""
        projection = None if include_password else {"password": 0}
        user = await self.collection.find_one({"email": email}, projection)
        if user:
            user["id"] = str(user.pop("_id"))
        return user
        
    async def check_email_exists(self, email: str) -> bool:
        """이메일 중복 확인"""
        count = await self.collection.count_documents({"email": email})
        return count > 0
