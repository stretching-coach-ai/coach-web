from fastapi import APIRouter, Response, Cookie, HTTPException
from typing import Optional

from app.services.auth_service import AuthService
from app.schemas.auth import LoginCredentials, AuthResponse
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()
auth_service = AuthService()

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    response: Response,
    session_cookie: Optional[str] = Cookie(None, alias="session_id")
):
    """회원가입 API - 기존 세션 데이터가 있다면 자동으로 연동됨"""
    try:
        user = await auth_service.register(
            user_data.email,
            user_data.password,
            session_cookie
        )
        
        # 회원가입 성공 시 자동 로그인
        _, new_session_id = await auth_service.login(
            user_data.email,
            user_data.password
        )
        
        # 새로운 세션 ID를 쿠키에 설정
        response.set_cookie(
            key="session_id",
            value=new_session_id,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=3600 * 24
        )
        
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: LoginCredentials,
    response: Response,
    session_cookie: Optional[str] = Cookie(None, alias="session_id")
):
    """로그인 API - 기존 세션이 있다면 연동"""
    try:
        user, new_session_id = await auth_service.login(
            credentials.email,
            credentials.password,
            session_cookie
        )
        
        response.set_cookie(
            key="session_id",
            value=new_session_id,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=3600 * 24
        )
        
        return AuthResponse(
            is_authenticated=True,
            user=user
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout")
async def logout(
    response: Response,
    session_cookie: Optional[str] = Cookie(None, alias="session_id")
):
    """로그아웃 API"""
    if session_cookie:
        await auth_service.logout(session_cookie)
    response.delete_cookie("session_id")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=AuthResponse)
async def get_current_user(
    session_cookie: Optional[str] = Cookie(None, alias="session_id")
):
    """현재 로그인한 사용자 정보 조회 API"""
    if not session_cookie:
        return AuthResponse(is_authenticated=False)
    
    user = await auth_service.validate_session(session_cookie)
    return AuthResponse(
        is_authenticated=bool(user),
        user=user
    ) 