#!/usr/bin/env python3
"""
사용자 데이터 마이그레이션 스크립트
- 기존 사용자 데이터에서 건강 프로필과 신체 상태 정보를 분리
- 실행 방법: python backend/app/scripts/migrate_user_data.py
"""

import asyncio
import logging
import sys
import os
from datetime import datetime
from bson import ObjectId

# 프로젝트 루트 디렉토리를 Python 경로에 추가
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
sys.path.insert(0, project_root)

from app.core.database import MongoManager
from app.schemas.health_profile import LifestylePattern
from app.schemas.body_condition import BodyPart, PainLevel

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

async def migrate_user_data():
    """사용자 데이터 마이그레이션"""
    logger.info("🚀 Starting user data migration...")
    
    # MongoDB 연결
    await MongoManager.connect()
    db = MongoManager.get_db()
    
    # 컬렉션 참조
    user_collection = db.users
    health_profile_collection = db.health_profiles
    body_condition_collection = db.body_conditions
    
    # 모든 사용자 조회
    users = await user_collection.find({}).to_list(None)
    logger.info(f"📊 Found {len(users)} users to migrate")
    
    migrated_profiles = 0
    migrated_conditions = 0
    
    for user in users:
        user_id = str(user["_id"])
        logger.info(f"🔄 Migrating data for user: {user_id}")
        
        # 1. 건강 프로필 데이터 추출 및 저장
        health_profile = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # 기본 필드 복사
        for field in ["age", "gender", "occupation", "height", "weight"]:
            if field in user:
                health_profile[field] = user[field]
        
        # 생활 패턴 정보 처리
        lifestyle = {}
        if "lifestyle" in user and isinstance(user["lifestyle"], dict):
            lifestyle = user["lifestyle"]
        elif "lifePattern" in user and isinstance(user["lifePattern"], str):
            lifestyle = {"description": user["lifePattern"]}
        
        if lifestyle:
            health_profile["lifestyle"] = lifestyle
        
        # 건강 프로필이 비어있지 않은 경우에만 저장
        if len(health_profile) > 3:  # user_id, created_at, updated_at 외에 다른 필드가 있는 경우
            # 이미 존재하는 프로필 확인
            existing_profile = await health_profile_collection.find_one({"user_id": user_id})
            
            if existing_profile:
                # 기존 프로필 업데이트
                await health_profile_collection.update_one(
                    {"_id": existing_profile["_id"]},
                    {"$set": health_profile}
                )
                logger.info(f"✅ Updated existing health profile for user: {user_id}")
            else:
                # 새 프로필 생성
                await health_profile_collection.insert_one(health_profile)
                logger.info(f"✅ Created new health profile for user: {user_id}")
            
            migrated_profiles += 1
        
        # 2. 신체 상태 데이터 추출 및 저장
        if "bodyConditions" in user and isinstance(user["bodyConditions"], list):
            for body_part_str in user["bodyConditions"]:
                try:
                    # 신체 부위 문자열을 BodyPart enum으로 변환
                    body_part = None
                    for bp in BodyPart:
                        if bp.value.lower() == body_part_str.lower():
                            body_part = bp
                            break
                    
                    if body_part is None:
                        # 매칭되는 enum이 없으면 기본값 사용
                        logger.warning(f"⚠️ Unknown body part: {body_part_str}, using as-is")
                        body_part = body_part_str
                    
                    body_condition = {
                        "user_id": user_id,
                        "body_part": body_part.value if isinstance(body_part, BodyPart) else body_part,
                        "pain_level": PainLevel.MODERATE.value,  # 기본값
                        "pain_description": f"이전 기록: {body_part_str} 불편함",
                        "created_at": datetime.utcnow()
                    }
                    
                    await body_condition_collection.insert_one(body_condition)
                    migrated_conditions += 1
                    
                except Exception as e:
                    logger.error(f"❌ Error migrating body condition: {e}")
        
        logger.info(f"✅ Completed migration for user: {user_id}")
    
    logger.info(f"🎉 Migration completed: {migrated_profiles} health profiles, {migrated_conditions} body conditions")
    
    # MongoDB 연결 종료
    await MongoManager.close()

if __name__ == "__main__":
    asyncio.run(migrate_user_data()) 