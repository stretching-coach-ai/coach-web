from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class LifestylePattern(BaseModel):
    """생활 패턴 정보"""
    work_hours_per_day: Optional[int] = Field(None, ge=0, le=24, description="일일 근무 시간")
    sitting_hours_per_day: Optional[int] = Field(None, ge=0, le=24, description="일일 좌식 시간")
    exercise_frequency_per_week: Optional[int] = Field(None, ge=0, le=7, description="주간 운동 횟수")
    sleep_hours_per_day: Optional[int] = Field(None, ge=0, le=24, description="일일 수면 시간")
    description: Optional[str] = Field(None, description="생활 패턴 추가 설명")

class HealthProfileBase(BaseModel):
    """건강 프로필 기본 정보"""
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[Gender] = None
    height: Optional[float] = Field(None, ge=100, le=250)  # cm
    weight: Optional[float] = Field(None, ge=30, le=200)  # kg
    occupation: Optional[str] = None
    lifestyle: Optional[LifestylePattern] = None

class HealthProfileCreate(HealthProfileBase):
    """건강 프로필 생성 모델"""
    user_id: str

class HealthProfileDB(HealthProfileBase):
    """데이터베이스 건강 프로필 모델"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class HealthProfileResponse(HealthProfileBase):
    """건강 프로필 응답 모델"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class HealthProfileUpdate(BaseModel):
    """건강 프로필 업데이트 모델"""
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[Gender] = None
    height: Optional[float] = Field(None, ge=100, le=250)  # cm
    weight: Optional[float] = Field(None, ge=30, le=200)  # kg
    occupation: Optional[str] = None
    lifestyle: Optional[LifestylePattern] = None 