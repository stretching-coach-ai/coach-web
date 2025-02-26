from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from app.schemas.session import StretchingSession

class UserCreate(BaseModel):
    """회원가입 요청 모델 (이메일 + 비밀번호만 입력)"""
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    name: Optional[str] = None

class UserResponse(BaseModel):
    """회원가입 후 응답 모델"""
    id: str
    email: EmailStr
    created_at: datetime
    name: Optional[str] = None
    stretching_history: Optional[List[StretchingSession]] = None

class UserProfileUpdate(BaseModel):
    """회원 프로필 업데이트 (추가 정보 입력)"""
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    lifePattern: Optional[str] = None
    bodyConditions: Optional[List[str]] = None
