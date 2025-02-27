from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
from app.schemas.user import UserResponse
from app.schemas.health_profile import (
    HealthProfileResponse, 
    HealthProfileCreate, 
    HealthProfileUpdate
)
from app.services.health_profile_service import HealthProfileService
from app.api.v1.dependencies import get_current_user, get_current_user_or_403

router = APIRouter()
health_profile_service = HealthProfileService()

@router.post("/health-profiles", response_model=HealthProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_health_profile(
    profile: HealthProfileCreate,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """건강 프로필 생성 API"""
    # 본인의 프로필만 생성 가능
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create your own health profile"
        )
    
    # 이미 프로필이 있는지 확인
    existing_profile = await health_profile_service.get_health_profile_by_user(current_user.id)
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Health profile already exists. Use PATCH to update."
        )
    
    profile_id = await health_profile_service.create_health_profile(profile)
    return await health_profile_service.get_health_profile(profile_id)

@router.get("/health-profiles/{profile_id}", response_model=HealthProfileResponse)
async def get_health_profile(
    profile_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """건강 프로필 조회 API"""
    profile = await health_profile_service.get_health_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Health profile not found")
    
    # 본인 또는 관리자만 조회 가능 (관리자 권한 체크 로직 필요)
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own health profile"
        )
    
    return profile

@router.get("/me/health-profile", response_model=HealthProfileResponse)
async def get_my_health_profile(
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """내 건강 프로필 조회 API"""
    profile = await health_profile_service.get_health_profile_by_user(current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Health profile not found")
    return profile

@router.patch("/health-profiles/{profile_id}", response_model=HealthProfileResponse)
async def update_health_profile(
    profile_id: str,
    profile_update: HealthProfileUpdate,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """건강 프로필 업데이트 API"""
    # 프로필 존재 확인 및 소유권 검증
    profile = await health_profile_service.get_health_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Health profile not found")
    
    # 본인 프로필만 수정 가능
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own health profile"
        )
    
    updated_profile = await health_profile_service.update_health_profile(profile_id, profile_update)
    return updated_profile

@router.patch("/me/health-profile", response_model=HealthProfileResponse)
async def update_my_health_profile(
    profile_update: HealthProfileUpdate,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """내 건강 프로필 업데이트 API (없으면 생성)"""
    updated_profile = await health_profile_service.update_health_profile_by_user(
        current_user.id, profile_update
    )
    return updated_profile

@router.delete("/health-profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_health_profile(
    profile_id: str,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """건강 프로필 삭제 API"""
    # 프로필 존재 확인 및 소유권 검증
    profile = await health_profile_service.get_health_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Health profile not found")
    
    # 본인 프로필만 삭제 가능
    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own health profile"
        )
    
    deleted = await health_profile_service.delete_health_profile(profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Health profile not found")
    
    return None 