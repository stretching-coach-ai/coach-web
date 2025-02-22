from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.user import UserResponse

class LoginCredentials(BaseModel):
    """로그인 요청 모델"""
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    """인증 응답 모델"""
    is_authenticated: bool
    user: Optional[UserResponse] = None 