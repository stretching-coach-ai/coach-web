from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum
from .body_condition import BodyPart, PainLevel
from .health_profile import Gender, LifestylePattern

class UserInputBase(BaseModel):
    """스트레칭 세션을 위한 사용자 입력 기본 정보"""
    age: int = Field(..., ge=0, le=120, description="사용자 나이")
    gender: Gender = Field(..., description="성별")
    occupation: str = Field(..., min_length=1, max_length=100, description="직업")
    lifestyle: str = Field(..., description="생활 패턴")
    selected_body_parts: str = Field(..., description="선택한 통증 부위")
    pain_level: int = Field(..., ge=0, le=10, description="통증 강도 (0-10)")
    pain_description: str = Field(..., min_length=10, max_length=500, description="통증 상세 설명")

class UserInput(UserInputBase):
    """스트레칭 세션을 위한 사용자 입력 모델"""
    session_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "age": 28,
                "gender": "female",
                "occupation": "사무직 회사원",
                "lifestyle": "주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면",
                "selected_body_parts": "목, 어깨",
                "pain_level": 7,
                "pain_description": "장시간 컴퓨터 작업으로 인한 목과 어깨 통증이 심하고, 특히 오른쪽 어깨가 뻐근하고 움직일 때 불편함"
            }
        }