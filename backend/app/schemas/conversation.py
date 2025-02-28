from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ConversationRequest(BaseModel):
    """대화 컨텍스트 요청 스키마"""
    question: str = Field(..., min_length=1, description="사용자의 후속 질문") 

class ConversationEntry(BaseModel):
    """대화 기록 항목 스키마"""
    role: str = Field(..., description="메시지 역할 (user 또는 assistant)")
    content: str = Field(..., description="메시지 내용")
    timestamp: Optional[str] = Field(None, description="메시지 타임스탬프")

class ConversationResponse(BaseModel):
    """대화 응답 스키마"""
    answer: str = Field(..., description="AI의 응답")
    conversation_id: Optional[str] = Field(None, description="대화 ID") 