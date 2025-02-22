from typing import Optional
from pydantic import BaseModel, Field

class AIResponse(BaseModel):
    text: str = Field(..., description="Helpy Pro API 응답 텍스트")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": """
사용자 상태 분석:
장시간의 컴퓨터 작업으로 인한 목과 어깨 통증을 호소하고 계십니다. 통증 강도가 7/10으로 상당한 수준이며, 적절한 스트레칭과 자세 교정이 필요합니다.

추천 스트레칭:
1. 목 긴장 완화 스트레칭
   - 바른 자세로 앉아서 천천히 목을 오른쪽으로 기울입니다
   - 30초간 유지한 후 반대쪽도 실시합니다
   - 하루 2-3회 반복하세요

2. 어깨 스트레칭
   - 어깨를 천천히 위로 올렸다가 내립니다 (10회)
   - 어깨를 뒤로 모았다가 풀어줍니다 (10회)

주의사항:
- 갑작스러운 통증이 있다면 즉시 중단하세요
- 천천히 호흡하며 진행하세요

생활습관 개선 제안:
- 30분마다 휴식을 취하세요
- 모니터 높이를 눈높이에 맞추세요
- 바른 자세로 앉는 습관을 기르세요

참고 자료:
스트레칭 가이드 영상: https://youtube.com/example
자세 교정 가이드: https://example.com/posture
"""
            }
        }