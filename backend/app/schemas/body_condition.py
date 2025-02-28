from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class BodyPart(str, Enum):
    NECK = "neck"
    SHOULDER = "shoulder"
    BACK = "back"
    WAIST = "waist"
    HIP = "hip"
    KNEE = "knee"
    ANKLE = "ankle"
    WRIST = "wrist"
    ELBOW = "elbow"

class PainLevel(int, Enum):
    NONE = 0
    VERY_MILD = 1
    MILD = 2
    MODERATE = 3
    UNCOMFORTABLE = 4
    MODERATE_SEVERE = 5
    SEVERE = 6
    VERY_SEVERE = 7
    INTENSE = 8
    VERY_INTENSE = 9
    WORST = 10

class BodyConditionBase(BaseModel):
    """신체 상태 기본 정보"""
    body_part: BodyPart
    pain_level: PainLevel
    pain_description: Optional[str] = Field(None, max_length=500)

class BodyConditionCreate(BodyConditionBase):
    """신체 상태 생성 모델"""
    user_id: str

class BodyConditionDB(BodyConditionBase):
    """데이터베이스 신체 상태 모델"""
    id: str
    user_id: str
    created_at: datetime

class BodyConditionResponse(BodyConditionBase):
    """신체 상태 응답 모델"""
    id: str
    user_id: str
    created_at: datetime

class BodyConditionUpdate(BaseModel):
    """신체 상태 업데이트 모델"""
    pain_level: Optional[PainLevel] = None
    pain_description: Optional[str] = Field(None, max_length=500)

class BodyConditionBatch(BaseModel):
    """여러 신체 상태 일괄 생성 모델"""
    user_id: str
    conditions: List[BodyConditionBase] 