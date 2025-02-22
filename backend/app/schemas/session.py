from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from .user_input import UserInput

class SessionBase(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    user_input: Optional[UserInput] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    feedback: Optional[Dict[str, Any]] = None

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    user_input: Optional[UserInput] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    feedback: Optional[Dict[str, Any]] = None

class SessionResponse(SessionBase):
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "123e4567-e89b-12d3-a456-426614174000",
                "created_at": "2024-02-22T10:00:00Z",
                "expires_at": "2024-02-23T10:00:00Z",
                "user_input": {
                    "age": 28,
                    "gender": "female",
                    "occupation": "사무직 회사원",
                    "lifestyle": {
                        "work_hours": 9,
                        "sitting_hours": 8,
                        "exercise_frequency": 1,
                        "sleep_hours": 6
                    },
                    "selected_body_parts": ["neck", "shoulder"],
                    "pain_level": 7,
                    "pain_description": "장시간 컴퓨터 작업으로 인한 목과 어깨 통증이 심하고, 특히 오른쪽 어깨가 뻐근하고 움직일 때 불편함"
                },
                "recommendations": [
                    {
                        "type": "stretching",
                        "title": "목과 어깨 통증 완화 스트레칭",
                        "description": "사무직 근로자를 위한 목과 어깨 긴장 완화 스트레칭 루틴",
                        "steps": [
                            "1. 목 부분 천천히 돌리기 (각 방향 5회)",
                            "2. 어깨 으쓱하기와 천천히 내리기 (10회)",
                            "3. 상부 승모근 스트레칭 (양쪽 각 30초)",
                            "4. 가슴 스트레칭 (30초)",
                            "5. 어깨 뒤로 모았다 펴기 (15회)"
                        ],
                        "duration": "10-15분",
                        "frequency": "하루 2-3회",
                        "precautions": [
                            "갑작스러운 통증이 있다면 즉시 중단하세요",
                            "천천히 호흡하며 진행하세요",
                            "무리한 자세는 피하세요"
                        ]
                    }
                ],
                "feedback": {
                    "effectiveness": 4,
                    "pain_reduction": true,
                    "comments": "스트레칭 후 어깨가 한결 가벼워졌고, 특히 목 돌리기가 도움이 많이 되었습니다."
                }
            }
        }