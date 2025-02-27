from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import Optional, List
from app.schemas.user import UserResponse, UserProfileUpdate, UserDelete
from app.schemas.session import StretchingSession
from app.services.user_service import UserService
from app.services.health_profile_service import HealthProfileService
from app.services.body_condition_service import BodyConditionService
from app.api.v1.dependencies import get_current_user, get_current_user_or_403

router = APIRouter()
user_service = UserService()
health_profile_service = HealthProfileService()
body_condition_service = BodyConditionService()

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """회원 정보 조회 API"""
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user_profile(
    user_id: str, 
    profile: UserProfileUpdate,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """회원 기본 정보 업데이트 API (이름, 이메일)"""
    # 본인 계정만 수정 가능
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
        
    updated_user = await user_service.update_user_profile(user_id, profile)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    delete_data: UserDelete,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """회원 탈퇴 API"""
    # 본인 계정만 삭제 가능
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own account"
        )
    
    # 비밀번호 확인 (auth_service를 통해 검증)
    user = await user_service.get_user_by_email(current_user.email, include_password=True)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 비밀번호 검증 로직은 auth_service에 구현되어 있어야 함
    # 여기서는 간단히 처리
    from app.core.security import verify_password
    if not verify_password(delete_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # 관련 데이터 삭제
    await health_profile_service.delete_health_profile_by_user(user_id)
    await body_condition_service.delete_body_conditions_by_user(user_id)
    
    # 사용자 계정 삭제
    deleted = await user_service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    
    return None

@router.get("/users/{user_id}/stretching-history", response_model=List[StretchingSession])
async def get_stretching_history(
    user_id: str,
    limit: int = Query(10, ge=1, le=50),
    skip: int = Query(0, ge=0)
):
    """회원의 스트레칭 히스토리 조회"""
    history = await user_service.get_stretching_history(user_id, limit, skip)
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
