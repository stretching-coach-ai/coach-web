from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from app.schemas.user import UserResponse
from app.schemas.body_condition import (
    BodyConditionResponse, 
    BodyConditionCreate, 
    BodyConditionUpdate,
    BodyConditionBatch
)
from app.services.body_condition_service import BodyConditionService
from app.api.v1.dependencies import get_current_user, get_current_user_or_403

router = APIRouter()
body_condition_service = BodyConditionService()

@router.post("/body-conditions", response_model=BodyConditionResponse, status_code=status.HTTP_201_CREATED)
async def create_body_condition(
    condition: BodyConditionCreate,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """신체 상태 생성 API"""
    # 본인의 신체 상태만 생성 가능
    if condition.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create your own body condition"
        )
    
    condition_id = await body_condition_service.create_body_condition(condition)
    return await body_condition_service.get_body_condition(condition_id)

@router.post("/body-conditions/batch", response_model=List[BodyConditionResponse], status_code=status.HTTP_201_CREATED)
async def create_body_conditions_batch(
    batch: BodyConditionBatch,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """여러 신체 상태 일괄 생성 API"""
    # 본인의 신체 상태만 생성 가능
    if batch.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create your own body conditions"
        )
    
    condition_ids = await body_condition_service.create_body_conditions_batch(batch)
    
    # 생성된 신체 상태 목록 조회
    result = []
    for condition_id in condition_ids:
        condition = await body_condition_service.get_body_condition(condition_id)
        if condition:
            result.append(condition)
    
    return result

@router.get("/body-conditions/{condition_id}", response_model=BodyConditionResponse)
async def get_body_condition(
    condition_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """신체 상태 조회 API"""
    condition = await body_condition_service.get_body_condition(condition_id)
    if not condition:
        raise HTTPException(status_code=404, detail="Body condition not found")
    
    # 본인 또는 관리자만 조회 가능 (관리자 권한 체크 로직 필요)
    if condition.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own body condition"
        )
    
    return condition

@router.get("/users/{user_id}/body-conditions", response_model=List[BodyConditionResponse])
async def get_user_body_conditions(
    user_id: str,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user)
):
    """사용자의 신체 상태 목록 조회 API"""
    # 본인 또는 관리자만 조회 가능 (관리자 권한 체크 로직 필요)
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own body conditions"
        )
    
    conditions = await body_condition_service.get_body_conditions_by_user(user_id, limit, skip)
    return conditions

@router.get("/me/body-conditions", response_model=List[BodyConditionResponse])
async def get_my_body_conditions(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """내 신체 상태 목록 조회 API"""
    conditions = await body_condition_service.get_body_conditions_by_user(current_user.id, limit, skip)
    return conditions

@router.get("/me/body-conditions/latest", response_model=List[BodyConditionResponse])
async def get_my_latest_body_conditions(
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """내 최신 신체 상태 조회 API (각 부위별 최신 1개)"""
    conditions = await body_condition_service.get_latest_body_conditions_by_user(current_user.id)
    return conditions

@router.patch("/body-conditions/{condition_id}", response_model=BodyConditionResponse)
async def update_body_condition(
    condition_id: str,
    condition_update: BodyConditionUpdate,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """신체 상태 업데이트 API"""
    # 신체 상태 존재 확인 및 소유권 검증
    condition = await body_condition_service.get_body_condition(condition_id)
    if not condition:
        raise HTTPException(status_code=404, detail="Body condition not found")
    
    # 본인의 신체 상태만 수정 가능
    if condition.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own body condition"
        )
    
    updated_condition = await body_condition_service.update_body_condition(condition_id, condition_update)
    return updated_condition

@router.delete("/body-conditions/{condition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_body_condition(
    condition_id: str,
    current_user: UserResponse = Depends(get_current_user_or_403)
):
    """신체 상태 삭제 API"""
    # 신체 상태 존재 확인 및 소유권 검증
    condition = await body_condition_service.get_body_condition(condition_id)
    if not condition:
        raise HTTPException(status_code=404, detail="Body condition not found")
    
    # 본인의 신체 상태만 삭제 가능
    if condition.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own body condition"
        )
    
    deleted = await body_condition_service.delete_body_condition(condition_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Body condition not found")
    
    return None 