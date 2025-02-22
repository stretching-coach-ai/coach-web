from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field
from backend.app.schemas.user_input import UserInput
from backend.app.core.config import settings

class TempSession(BaseModel):
    """임시 세션 데이터를 MongoDB에 저장하기 위한 모델"""
    id: Optional[str] = Field(None, alias="_id")
    session_id: str = Field(..., description="세션 고유 식별자")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="세션 생성 시간")
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(hours=settings.SESSION_EXPIRY_HOURS),
        description="세션 만료 시간"
    )
    user_input: Optional[UserInput] = Field(None, description="사용자 입력 데이터")
    ai_response: Optional[str] = Field(None, description="AI 추천 응답 텍스트")
    feedback: Optional[str] = Field(None, description="사용자 피드백")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
