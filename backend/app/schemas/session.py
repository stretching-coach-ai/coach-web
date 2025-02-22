from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from .user_input import UserInput

class SessionBase(BaseModel):
    session_id: str = Field(..., description="세션 고유 식별자")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="세션 생성 시간")
    expires_at: datetime = Field(..., description="세션 만료 시간")
    user_input: Optional[Dict[str, Any]] = Field(None, description="사용자 입력 데이터")
    ai_response: Optional[str] = Field(None, description="AI 추천 응답 텍스트")
    feedback: Optional[str] = Field(None, description="사용자 피드백")

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    user_input: Optional[Dict[str, Any]] = None
    ai_response: Optional[str] = None
    feedback: Optional[str] = None

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
                    "selected_body_parts": "목, 어깨",
                    "pain_level": 7,
                    "pain_description": "장시간 컴퓨터 작업으로 인한 목과 어깨 통증이 심하고, 특히 오른쪽 어깨가 뻐근하고 움직일 때 불편함"
                },
                "ai_response": "사용자 상태 분석:\n장시간의 컴퓨터 작업으로 인한 목과 어깨 통증을 호소하고 계십니다...",
                "feedback": "스트레칭 후 어깨가 한결 가벼워졌고, 특히 목 돌리기가 도움이 많이 되었습니다."
            }
        }