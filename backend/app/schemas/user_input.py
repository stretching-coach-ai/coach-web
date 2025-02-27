from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

# LifestylePattern 클래스는 더 이상 사용하지 않으므로 주석 처리 또는 제거
# class LifestylePattern(BaseModel):
#     work_hours: int = Field(..., ge=0, le=24, description="일일 근무 시간")
#     sitting_hours: int = Field(..., ge=0, le=24, description="일일 좌식 시간")
#     exercise_frequency: int = Field(..., ge=0, le=7, description="주간 운동 횟수")
#     sleep_hours: int = Field(..., ge=0, le=24, description="일일 수면 시간")

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

class UserInputBase(BaseModel):
    age: int = Field(..., ge=0, le=120, description="사용자 나이")
    gender: str = Field(..., description="성별")
    occupation: str = Field(..., min_length=1, max_length=100, description="직업")
    # lifestyle을 객체에서 문자열로 변경
    lifestyle: str = Field(..., description="생활 패턴")
    selected_body_parts: str = Field(..., description="선택한 통증 부위")
    pain_level: int = Field(..., ge=0, le=10, description="통증 강도 (0-10)")
    pain_description: str = Field(..., min_length=10, max_length=500, description="통증 상세 설명")

class UserInput(UserInputBase):
    session_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "age": 28,
                "gender": "여성",
                "occupation": "사무직 회사원",
                "lifestyle": "주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면",
                "selected_body_parts": "목, 어깨",
                "pain_level": 7,
                "pain_description": "장시간 컴퓨터 작업으로 인한 목과 어깨 통증이 심하고, 특히 오른쪽 어깨가 뻐근하고 움직일 때 불편함"
            }
        }