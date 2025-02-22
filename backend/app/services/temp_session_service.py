from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from backend.app.core.database import MongoManager
from backend.app.models.temp_session import TempSession
from backend.app.schemas.user_input import UserInput

class TempSessionService:
    """임시 세션 관리를 위한 서비스 클래스"""
    
    collection_name = "temp_sessions"
    
    @classmethod
    async def initialize_indexes(cls):
        """세션 컬렉션에 필요한 인덱스 생성"""
        collection = MongoManager.get_collection(cls.collection_name)
        # session_id에 대한 유니크 인덱스
        await collection.create_index("session_id", unique=True)
        # TTL 인덱스 - expires_at 시간이 지나면 자동 삭제
        await collection.create_index("expires_at", expireAfterSeconds=0)
    
    @classmethod
    async def create_session(cls, session_id: str) -> TempSession:
        """새로운 임시 세션 생성"""
        session = TempSession(session_id=session_id)
        collection = MongoManager.get_collection(cls.collection_name)
        
        result = await collection.insert_one(session.dict(by_alias=True))
        session.id = str(result.inserted_id)
        return session
    
    @classmethod
    async def get_session(cls, session_id: str) -> Optional[TempSession]:
        """세션 ID로 세션 조회"""
        collection = MongoManager.get_collection(cls.collection_name)
        data = await collection.find_one({"session_id": session_id})
        if data:
            data["id"] = str(data.pop("_id"))
            return TempSession(**data)
        return None
    
    @classmethod
    async def update_user_input(cls, session_id: str, user_input: UserInput) -> Optional[TempSession]:
        """사용자 입력 데이터 업데이트"""
        collection = MongoManager.get_collection(cls.collection_name)
        result = await collection.find_one_and_update(
            {"session_id": session_id},
            {"$set": {"user_input": user_input.dict()}},
            return_document=True
        )
        if result:
            result["id"] = str(result.pop("_id"))
            return TempSession(**result)
        return None
    
    @classmethod
    async def update_ai_response(cls, session_id: str, ai_response: str) -> Optional[TempSession]:
        """AI 응답 업데이트"""
        collection = MongoManager.get_collection(cls.collection_name)
        result = await collection.find_one_and_update(
            {"session_id": session_id},
            {"$set": {"ai_response": ai_response}},
            return_document=True
        )
        if result:
            result["id"] = str(result.pop("_id"))
            return TempSession(**result)
        return None
    
    @classmethod
    async def update_feedback(cls, session_id: str, feedback: str) -> Optional[TempSession]:
        """사용자 피드백 업데이트"""
        collection = MongoManager.get_collection(cls.collection_name)
        result = await collection.find_one_and_update(
            {"session_id": session_id},
            {"$set": {"feedback": feedback}},
            return_document=True
        )
        if result:
            result["id"] = str(result.pop("_id"))
            return TempSession(**result)
        return None
    
    @classmethod
    async def delete_session(cls, session_id: str) -> bool:
        """세션 삭제"""
        collection = MongoManager.get_collection(cls.collection_name)
        result = await collection.delete_one({"session_id": session_id})
        return result.deleted_count > 0