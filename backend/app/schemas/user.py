from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    """사용자 기본 정보"""
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    """회원가입 요청 모델"""
    password: str = Field(min_length=6, max_length=100)

class UserDB(UserBase):
    """데이터베이스 사용자 모델"""
    id: str
    created_at: datetime
    password: str  # 해시된 비밀번호

class UserResponse(UserBase):
    """회원가입 후 응답 모델"""
    id: str
    created_at: datetime

class UserProfileUpdate(BaseModel):
    """회원 기본 정보 업데이트"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserDelete(BaseModel):
    """회원 탈퇴 요청"""
    password: str = Field(..., min_length=6, max_length=100)
