from backend.app.core.database import MongoManager
from backend.app.models.temp_session import TempSession
from bson import ObjectId

class TempSessionService:
    def __init__(self):
        self.temp_sessions = {}

    async def create_temp_session(self, session_id: str, data: dict):
        """비회원 데이터를 임시 저장"""
        self.temp_sessions[session_id] = data

    async def get_temp_session(self, session_id: str):
        """비회원 데이터 조회"""
        return self.temp_sessions.get(session_id)

    async def delete_temp_session(self, session_id: str):
        """비회원 데이터 삭제"""
        if session_id in self.temp_sessions:
            del self.temp_sessions[session_id]