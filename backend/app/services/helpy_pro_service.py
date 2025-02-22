from typing import Optional
import httpx
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.schemas.user_input import UserInput
from backend.app.schemas.ai_response import AIResponse

class HelpyProService:
    """Helpy Pro API와의 통신을 담당하는 서비스 클래스"""

    API_URL = settings.HELPY_PRO_API_URL
    API_KEY = settings.HELPY_PRO_API_KEY
    MAX_TOKENS = 2048

    @classmethod
    def _create_stretching_prompt(cls, user_input: UserInput) -> str:
        """스트레칭 가이드 생성을 위한 프롬프트"""
        return """아래 제공된 사용자 데이터를 기반으로 맞춤형 스트레칭 가이드를 제공해주세요.
사용자의 직업, 생활패턴, 통증 정보를 종합적으로 분석하여 실질적인 도움이 되는 솔루션을 제시해주세요.

1. 상태 분석
- 생활습관과 통증의 상관관계
- 주요 개선점
- 위험 요소

2. 맞춤형 스트레칭 프로그램
- 준비 운동
- 핵심 스트레칭 동작
  * 동작 방법
  * 시간/횟수
  * 호흡법
  * 주의사항
- 마무리 운동

3. 생활 습관 개선 가이드
- 자세 교정법
- 틈틈이 할 수 있는 운동
- 장기적 관리 방법

4. 주의사항
- 피해야 할 동작
- 통증 악화 시 대처법
- 전문의 상담이 필요한 상황

사용자 데이터:
{user_input.json(indent=2)}

전문적인 내용을 친근한 말투로 설명해주되, 구체적이고 실천 가능한 조언을 제공해주세요."""

    @classmethod
    async def generate_stretching_guide(
        cls, 
        session_id: str,
        user_input: UserInput
    ) -> AIResponse:
        """스트레칭 가이드 생성"""
        headers = {
            "Authorization": f"Bearer {cls.API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        request_data = {
            "model": "helpy-v1",
            "sess_id": session_id,
            "max_tokens": cls.MAX_TOKENS,
            "messages": [
                {
                    "role": "system",
                    "content": """당신은 전문 스트레칭 코치입니다. 
사용자의 직업, 생활패턴, 통증 정보를 분석하여 맞춤형 솔루션을 제공합니다.
전문적인 내용을 쉽고 친근하게 설명하되, 각 조언에 대한 이유와 기대 효과를 포함해주세요."""
                },
                {
                    "role": "user",
                    "content": cls._create_stretching_prompt(user_input)
                }
            ]
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{cls.API_URL}/v1/chat/completions",
                    json=request_data,
                    headers=headers,
                    timeout=None
                )
                
                response.raise_for_status()
                response_data = response.json()
                ai_response = response_data["choices"][0]["message"]["content"]
                
                return AIResponse(text=ai_response)
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise HTTPException(
                    status_code=500,
                    detail="AI 서버 인증 오류. 관리자에게 문의해주세요."
                )
            elif e.response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="AI 서버 오류. 잠시 후 다시 시도해주세요."
                )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"예기치 못한 오류가 발생했습니다: {str(e)}"
            ) 