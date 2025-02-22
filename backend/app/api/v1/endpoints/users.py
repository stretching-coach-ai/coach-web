from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from backend.app.schemas.user import UserCreate, UserResponse, UserProfileUpdate
from backend.app.schemas.session import StretchingSession
from backend.app.services.user_service import UserService

router = APIRouter()
user_service = UserService()

@router.post("/users/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    session_id: Optional[str] = Query(None, description="기존 비회원 데이터 연동을 위한 session_id")
):
    """회원가입 API (이메일 + 비밀번호만 입력, 기존 비회원 데이터 연동 가능)"""
    try:
        user_id = await user_service.create_user(user.model_dump(), session_id)
        created_user = await user_service.get_user(user_id)
        return created_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
