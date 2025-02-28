from fastapi import Depends, Cookie, HTTPException, status, APIRouter
from typing import Optional

from app.services.auth_service import AuthService
from app.schemas.user import UserResponse

auth_service = AuthService()
router = APIRouter()

async def get_current_user(
    session_cookie: Optional[str] = Cookie(None, alias="session_id")
) -> Optional[UserResponse]:
    """
    현재 로그인한 사용자 정보를 가져오는 의존성 함수
    
    Args:
        session_cookie: 쿠키에서 가져온 세션 ID
        
    Returns:
        UserResponse: 로그인한 사용자 정보
        
    Raises:
        HTTPException: 인증되지 않은 사용자인 경우
    """
    if not session_cookie:
        return None
        
    user = await auth_service.validate_session(session_cookie)
    return user

async def get_current_user_or_403(
    current_user: Optional[UserResponse] = Depends(get_current_user)
) -> UserResponse:
    """
    현재 로그인한 사용자 정보를 가져오거나 403 에러를 반환하는 의존성 함수
    
    Args:
        current_user: get_current_user 의존성에서 가져온 사용자 정보
        
    Returns:
        UserResponse: 로그인한 사용자 정보
        
    Raises:
        HTTPException: 인증되지 않은 사용자인 경우
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authentication required"
        )
    return current_user 