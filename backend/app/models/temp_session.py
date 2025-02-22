from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.session import StretchingSession
from app.core.config import settings

class TempSession(BaseModel):
    """임시 세션 데이터를 MongoDB에 저장하기 위한 모델"""
    id: Optional[str] = Field(None, alias="_id")
    session_id: str = Field(..., description="세션 고유 식별자")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="세션 생성 시간")
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(hours=settings.SESSION_EXPIRY_HOURS),
        description="세션 만료 시간"
    )
    stretching_sessions: List[StretchingSession] = Field(default_factory=list, description="스트레칭 세션 목록")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
