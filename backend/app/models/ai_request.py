from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user_input import UserInput

class AIRequestDB(BaseModel):
    """MongoDB에 저장할 AI 요청 데이터 모델"""
    id: Optional[str] = Field(default=None)
    user_id: Optional[str] = None  # 사용자 ID (로그인한 경우)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # AI 요청 관련 데이터
    user_input: UserInput = Field(..., description="사용자 입력 데이터")
    ai_response: Optional[str] = None
    feedback: Optional[str] = None
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 