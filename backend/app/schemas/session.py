from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from .user_input import UserInput

class StretchingSession(BaseModel):
    """개별 스트레칭 세션 정보"""
    id: str = Field(..., description="스트레칭 세션 ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="스트레칭 세션 생성 시간")
    user_input: Optional[UserInput] = Field(None, description="사용자 입력 데이터")
    ai_response: Optional[str] = Field(None, description="AI 추천 응답 텍스트")
    feedback: Optional[str] = Field(None, description="사용자 피드백")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "stretch_123",
                "created_at": "2024-02-22T10:00:00Z",
                "user_input": {
                    "age": 28,
                    "gender": "여성",
                    "occupation": "사무직 회사원",
                    "lifestyle": "주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면",
                    "selected_body_parts": "목, 어깨",
                    "pain_level": 7,
                    "pain_description": "장시간 컴퓨터 작업으로 인한 목과 어깨 통증이 심하고, 특히 오른쪽 어깨가 뻐근하고 움직일 때 불편함"
                },
                "ai_response": "사용자 상태 분석:\n장시간의 컴퓨터 작업으로 인한 목과 어깨 통증을 호소하고 계십니다...",
                "feedback": "스트레칭 후 어깨가 한결 가벼워졌고, 특히 목 돌리기가 도움이 많이 되었습니다."
            }
        }

# 멀티톤 방식으로 세션 구조 변경
class SessionBase(BaseModel):
    """임시 세션 기본 모델"""
    session_id: str = Field(..., description="세션 고유 식별자")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="세션 생성 시간")
    expires_at: datetime = Field(..., description="세션 만료 시간")
    # 여러 스트레칭 세션 저장
    stretching_sessions: List[StretchingSession] = Field(default_factory=list, description="스트레칭 세션 목록")

class SessionCreate(BaseModel):
    """세션 생성 요청 모델"""
    pass

class SessionResponse(SessionBase):
    """세션 응답 모델"""
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "123e4567-e89b-12d3-a456-426614174000",
                "created_at": "2024-02-22T10:00:00Z",
                "expires_at": "2024-02-23T10:00:00Z",
                "stretching_sessions": [
                    {
                        "id": "stretch_123",
                        "created_at": "2024-02-22T10:00:00Z",
                        "user_input": {
                            "age": 28,
                            "gender": "여성",
                            "occupation": "사무직 회사원",
                            "lifestyle": "주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면",
                            "selected_body_parts": "목, 어깨",
                            "pain_level": 7,
                            "pain_description": "장시간 컴퓨터 작업으로 인한 목과 어깨 통증이 심하고, 특히 오른쪽 어깨가 뻐근하고 움직일 때 불편함"
                        },
                        "ai_response": "사용자 상태 분석:\n장시간의 컴퓨터 작업으로 인한 목과 어깨 통증을 호소하고 계십니다...",
                        "feedback": "스트레칭 후 어깨가 한결 가벼워졌고, 특히 목 돌리기가 도움이 많이 되었습니다."
                    }
                ]
            }
        }