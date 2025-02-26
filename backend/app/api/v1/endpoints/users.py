from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from app.schemas.user import UserResponse, UserProfileUpdate
from app.schemas.session import StretchingSession
from app.services.user_service import UserService
from app.api.v1.dependencies import get_current_user, get_current_user_or_403

router = APIRouter()
user_service = UserService()

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """회원 정보 조회 API"""
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user_profile(user_id: str, profile: UserProfileUpdate):
    """회원 프로필 업데이트 API (나이, 직업 등 추가 정보 입력)"""
    updated_user = await user_service.update_user_profile(user_id, profile.dict(exclude_none=True))
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.get("/users/{user_id}/stretching-history", response_model=List[StretchingSession])
async def get_stretching_history(
    user_id: str,
    limit: int = Query(10, ge=1, le=50),
    skip: int = Query(0, ge=0)
):
    """회원의 스트레칭 히스토리 조회"""
    history = await user_service.get_stretching_history(user_id, limit, skip)
    if history is None:
        raise HTTPException(status_code=404, detail="User not found")
    return history

@router.get("/me/stretching-history", response_model=List[StretchingSession])
async def get_my_stretching_history(
    limit: int = Query(10, ge=1, le=50),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """현재 로그인한 사용자의 스트레칭 히스토리 조회"""
    history = await user_service.get_stretching_history(current_user.id, limit, skip)
    return history

@router.get("/me/stretching/{stretching_id}", response_model=StretchingSession)
async def get_my_stretching_session(
    stretching_id: str,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """현재 로그인한 사용자의 특정 스트레칭 세션 조회"""
    history = await user_service.get_stretching_history(current_user.id, limit=100)
    
    # 특정 ID의 스트레칭 세션 찾기
    stretching_session = next(
        (session for session in history if session.id == stretching_id),
        None
    )
    
    if not stretching_session:
        raise HTTPException(status_code=404, detail="Stretching session not found")
    
    return stretching_session
