# backend/app/models/user.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr

class UserDB(BaseModel):
    """MongoDB에 저장할 사용자 모델"""
    id: Optional[str] = Field(default=None)
    email: EmailStr
    password: str  
    created_at: datetime = Field(default_factory=datetime.utcnow)

    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    lifePattern: Optional[str] = None
    bodyConditions: Optional[List[str]] = None
