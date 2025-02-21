from backend.app.core.database import MongoManager
from backend.app.models.user import UserDB
from backend.app.schemas.user import UserResponse, UserProfileUpdate
from backend.app.services.temp_session_service import TempSessionService
from bson import ObjectId

class UserService:
    def __init__(self):
        self.collection = MongoManager.get_db().users
        self.temp_session_service = TempSessionService()

    async def create_user(self, user_data: dict, session_id: str = None) -> str:
        """회원가입 (비회원 데이터가 있다면 연동)"""
        user = UserDB(**user_data)
        user_dict = user.model_dump(exclude={"id"}) 
        result = await self.collection.insert_one(user_dict)  # MongoDB에서 `_id` 자동 생성
        user_id = str(result.inserted_id)

        # 기존 비회원 데이터 병합
        if session_id:
            temp_data = await self.temp_session_service.get_temp_session(session_id)
            if temp_data:
                await self.collection.update_one(
                    {"_id": ObjectId(user_id)}, {"$set": temp_data.dict(exclude={"id", "session_id"})}
                )
                await self.temp_session_service.delete_temp_session(session_id)

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
