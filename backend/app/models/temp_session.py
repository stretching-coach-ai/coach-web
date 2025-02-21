from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

class TempSession(BaseModel):
    """비회원이 이용한 데이터를 임시로 저장하는 모델"""
    id: Optional[str]
    session_id: str  
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    lifePattern: Optional[str] = None
    bodyConditions: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
