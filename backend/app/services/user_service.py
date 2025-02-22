from app.core.database import MongoManager
from app.models.user import UserDB
from app.schemas.user import UserResponse, UserProfileUpdate
from app.services.temp_session_service import TempSessionService
from bson import ObjectId

class UserService:
    def __init__(self):
        self.collection = MongoManager.get_db().users
        self.temp_session_service = TempSessionService()

    async def create_user(self, user_data: dict, session_id: str = None) -> str:
        """회원가입 (비회원 데이터가 있다면 연동)"""
        # 1. 기본 사용자 데이터로 계정 생성
        user = UserDB(**user_data)
        user_dict = user.model_dump(exclude={"id"})
        result = await self.collection.insert_one(user_dict)
        user_id = str(result.inserted_id)

        # 2. 임시 세션 데이터 마이그레이션
        if session_id:
            temp_session = await self.temp_session_service.get_session(session_id)
            if temp_session and temp_session.stretching_sessions:
                # 2.1. 가장 최근 스트레칭 세션에서 사용자 정보 추출
                latest_stretching = temp_session.stretching_sessions[-1]
                user_profile = {
                    "age": latest_stretching.user_input.age,
                    "gender": latest_stretching.user_input.gender,
                    "occupation": latest_stretching.user_input.occupation,
                    "lifestyle": latest_stretching.user_input.lifestyle.dict()
                }
                
                # 2.2. 스트레칭 히스토리 저장
                await self.collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$set": user_profile,
                        "$push": {
                            "stretching_history": {
                                "$each": [session.dict() for session in temp_session.stretching_sessions]
                            }
                        }
                    }
                )
                
                # 2.3. 임시 세션 삭제
                await self.temp_session_service.delete_session(session_id)

        return user_id

    async def get_user(self, user_id: str) -> UserResponse:
        """사용자 조회 (비밀번호 제외)"""
        user = await self.collection.find_one({"_id": ObjectId(user_id)}, {"password": 0})
        if user:
            user["id"] = str(user.pop("_id"))
            return UserResponse(**user)
        return None

    async def update_user_profile(self, user_id: str, update_data: dict):
        """사용자 프로필 업데이트"""
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)}, {"$set": update_data}
        )
        if result.modified_count == 0:
            return None
        return await self.get_user(user_id)

    async def add_stretching_session(self, user_id: str, stretching_session: dict):
        """스트레칭 세션 추가"""
        result = await self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"stretching_history": stretching_session}}
        )
        if result.modified_count == 0:
            return None
        return await self.get_user(user_id)

    async def get_stretching_history(self, user_id: str, limit: int = 10, skip: int = 0):
        """스트레칭 히스토리 조회"""
        user = await self.collection.find_one(
            {"_id": ObjectId(user_id)},
            {"stretching_history": {"$slice": [skip, limit]}}
        )
        if not user:
            return None
        return user.get("stretching_history", [])
