from app.core.database import MongoManager
from app.schemas.health_profile import (
    HealthProfileCreate, 
    HealthProfileResponse, 
    HealthProfileUpdate
)
from bson import ObjectId
from typing import Optional, List
from datetime import datetime

class HealthProfileService:
    def __init__(self):
        self.collection = MongoManager.get_db().health_profiles

    async def create_health_profile(self, profile_data: HealthProfileCreate) -> str:
        """건강 프로필 생성"""
        profile_dict = profile_data.model_dump()
        profile_dict["created_at"] = datetime.utcnow()
        profile_dict["updated_at"] = profile_dict["created_at"]
        
        result = await self.collection.insert_one(profile_dict)
        return str(result.inserted_id)

    async def get_health_profile(self, profile_id: str) -> Optional[HealthProfileResponse]:
        """건강 프로필 조회"""
        profile = await self.collection.find_one({"_id": ObjectId(profile_id)})
        if profile:
            profile["id"] = str(profile.pop("_id"))
            return HealthProfileResponse(**profile)
        return None

    async def get_health_profile_by_user(self, user_id: str) -> Optional[HealthProfileResponse]:
        """사용자 ID로 건강 프로필 조회"""
        profile = await self.collection.find_one({"user_id": user_id})
        if profile:
            profile["id"] = str(profile.pop("_id"))
            return HealthProfileResponse(**profile)
        return None

    async def update_health_profile(self, profile_id: str, update_data: HealthProfileUpdate) -> Optional[HealthProfileResponse]:
        """건강 프로필 업데이트"""
        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            return await self.get_health_profile(profile_id)
        
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await self.collection.update_one(
            {"_id": ObjectId(profile_id)}, {"$set": update_dict}
        )
        if result.modified_count == 0:
            return None
        return await self.get_health_profile(profile_id)

    async def update_health_profile_by_user(self, user_id: str, update_data: HealthProfileUpdate) -> Optional[HealthProfileResponse]:
        """사용자 ID로 건강 프로필 업데이트"""
        profile = await self.collection.find_one({"user_id": user_id})
        if not profile:
            # 프로필이 없으면 새로 생성
            profile_data = HealthProfileCreate(user_id=user_id, **update_data.model_dump(exclude_unset=True))
            profile_id = await self.create_health_profile(profile_data)
            return await self.get_health_profile(profile_id)
        
        # 기존 프로필 업데이트
        profile_id = str(profile["_id"])
        return await self.update_health_profile(profile_id, update_data)

    async def delete_health_profile(self, profile_id: str) -> bool:
        """건강 프로필 삭제"""
        result = await self.collection.delete_one({"_id": ObjectId(profile_id)})
        return result.deleted_count > 0

    async def delete_health_profile_by_user(self, user_id: str) -> bool:
        """사용자 ID로 건강 프로필 삭제"""
        result = await self.collection.delete_one({"user_id": user_id})
        return result.deleted_count > 0 