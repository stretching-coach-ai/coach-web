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

    @classmethod
    async def generate_stretching_guide(cls, user_input: UserInput) -> AIResponse:
        """사용자 입력을 기반으로 스트레칭 가이드 생성"""
        
        headers = {
            "Authorization": f"Bearer {cls.API_KEY}",
            "Content-Type": "application/json"
        }
        
        # API 요청 데이터 구성
        request_data = {
            "user_data": {
                "age": user_input.age,
                "gender": user_input.gender,
                "occupation": user_input.occupation,
                "lifestyle": user_input.lifestyle.dict(),
                "selected_body_parts": user_input.selected_body_parts,
                "pain_level": user_input.pain_level,
                "pain_description": user_input.pain_description
            }
        }

        # API 호출 및 응답 처리
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{cls.API_URL}/generate",
                    json=request_data,
                    headers=headers,
                    timeout=None  
                )
                
                response.raise_for_status()
                return AIResponse(text=response.json()["response"])
                
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