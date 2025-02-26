from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from app.schemas.session import StretchingSession

class UserDB(BaseModel):
    """MongoDB에 저장할 사용자 모델"""
    id: Optional[str] = Field(default=None)
    email: EmailStr
    password: str  
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # 프로필 정보
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    
    # 생활패턴 정보
    lifestyle: Optional[dict] = None  # LifestylePattern 데이터
    
    # 스트레칭 히스토리
    stretching_history: List[StretchingSession] = Field(default_factory=list)
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
