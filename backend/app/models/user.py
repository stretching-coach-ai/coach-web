from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr

class UserDB(BaseModel):
    """MongoDB에 저장할 사용자 모델"""
    id: Optional[str] = Field(default=None)
    email: EmailStr
    password: str  
    name: Optional[str] = None  # 사용자 이름 필드 추가
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 프로필 정보 및 생활패턴 정보, 스트레칭 히스토리 제거
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
