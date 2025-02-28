from app.core.database import MongoManager
from app.schemas.body_condition import (
    BodyConditionCreate, 
    BodyConditionResponse, 
    BodyConditionUpdate,
    BodyConditionBatch
)
from bson import ObjectId
from typing import Optional, List
from datetime import datetime

class BodyConditionService:
    def __init__(self):
        self.collection = MongoManager.get_db().body_conditions

    async def create_body_condition(self, condition_data: BodyConditionCreate) -> str:
        """신체 상태 생성"""
        condition_dict = condition_data.model_dump()
        condition_dict["created_at"] = datetime.utcnow()
        
        result = await self.collection.insert_one(condition_dict)
        return str(result.inserted_id)

    async def create_body_conditions_batch(self, batch_data: BodyConditionBatch) -> List[str]:
        """여러 신체 상태 일괄 생성"""
        user_id = batch_data.user_id
        conditions = []
        
        for condition in batch_data.conditions:
            condition_dict = condition.model_dump()
            condition_dict["user_id"] = user_id
            condition_dict["created_at"] = datetime.utcnow()
            conditions.append(condition_dict)
        
        if not conditions:
            return []
            
        result = await self.collection.insert_many(conditions)
        return [str(id) for id in result.inserted_ids]

    async def get_body_condition(self, condition_id: str) -> Optional[BodyConditionResponse]:
        """신체 상태 조회"""
        condition = await self.collection.find_one({"_id": ObjectId(condition_id)})
        if condition:
            condition["id"] = str(condition.pop("_id"))
            return BodyConditionResponse(**condition)
        return None

    async def get_body_conditions_by_user(self, user_id: str, limit: int = 50, skip: int = 0) -> List[BodyConditionResponse]:
        """사용자 ID로 신체 상태 목록 조회"""
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        conditions = await cursor.to_list(length=limit)
        
        result = []
        for condition in conditions:
            condition["id"] = str(condition.pop("_id"))
            result.append(BodyConditionResponse(**condition))
        
        return result

    async def get_latest_body_conditions_by_user(self, user_id: str) -> List[BodyConditionResponse]:
        """사용자 ID로 최신 신체 상태 조회 (각 부위별 최신 1개)"""
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"created_at": -1}},
            {"$group": {
                "_id": "$body_part",
                "doc": {"$first": "$$ROOT"}
            }},
            {"$replaceRoot": {"newRoot": "$doc"}}
        ]
        
        conditions = await self.collection.aggregate(pipeline).to_list(length=None)
        
        result = []
        for condition in conditions:
            condition["id"] = str(condition.pop("_id"))
            result.append(BodyConditionResponse(**condition))
        
        return result

    async def update_body_condition(self, condition_id: str, update_data: BodyConditionUpdate) -> Optional[BodyConditionResponse]:
        """신체 상태 업데이트"""
        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            return await self.get_body_condition(condition_id)
        
        result = await self.collection.update_one(
            {"_id": ObjectId(condition_id)}, {"$set": update_dict}
        )
        if result.modified_count == 0:
            return None
        return await self.get_body_condition(condition_id)

    async def delete_body_condition(self, condition_id: str) -> bool:
        """신체 상태 삭제"""
        result = await self.collection.delete_one({"_id": ObjectId(condition_id)})
        return result.deleted_count > 0

    async def delete_body_conditions_by_user(self, user_id: str) -> int:
        """사용자 ID로 모든 신체 상태 삭제"""
        result = await self.collection.delete_many({"user_id": user_id})
        return result.deleted_count 