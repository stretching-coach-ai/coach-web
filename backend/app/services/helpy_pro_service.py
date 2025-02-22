from typing import Optional
import httpx
import logging
from fastapi import HTTPException
import json
import time
import asyncio
from contextlib import asynccontextmanager

from app.core.config import settings
from app.schemas.user_input import UserInput
from app.schemas.ai_response import AIResponse

# 로거 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class HelpyProService:
    """Helpy Pro API와의 통신을 담당하는 서비스 클래스"""

    API_URL = "https://api-cloud-function.elice.io/9f071d94-a459-429d-a375-9601e521b079"
    API_KEY = settings.HELPY_PRO_API_KEY
    MAX_TOKENS = 2048
    
    # 동시 요청 제어를 위한 세마포어
    _semaphore = asyncio.Semaphore(50)  # 최대 10개의 동시 요청 허용
    
    # HTTP 클라이언트 풀
    _client_pool = None
    _max_connections = 50  # 최대 연결 수

    @classmethod
    @asynccontextmanager
    async def get_client(cls):
        """HTTP 클라이언트 풀 관리"""
        if cls._client_pool is None:
            limits = httpx.Limits(max_connections=cls._max_connections)
            cls._client_pool = httpx.AsyncClient(timeout=None, limits=limits)
        
        try:
            yield cls._client_pool
        except Exception as e:
            logger.error(f"Error with HTTP client: {e}")
            raise

    @classmethod
    def _create_stretching_prompt(cls, user_input: UserInput) -> str:
        """스트레칭 가이드 생성을 위한 통합 프롬프트"""
        return f"""사용자 데이터를 분석하고 스트레칭 가이드를 제공해주세요.

데이터: {user_input.model_dump_json()}

검색어: "{user_input.selected_body_parts} 스트레칭"

형식:
[분석]
- 상태/위험/개선점

[가이드]
- 스트레칭
- 생활수칙
- 주의사항"""

    @classmethod
    async def generate_stretching_guide(
        cls, 
        session_id: str,
        user_input: UserInput
    ) -> AIResponse:
        """스트레칭 가이드 생성"""
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "Authorization": f"Bearer {cls.API_KEY}"
        }

        try:
            # 세마포어를 사용하여 동시 요청 제어
            async with cls._semaphore:
                logger.info(f"Generating stretching guide for session_id: {session_id}")
                response = await cls._get_api_response(
                    session_id=session_id,
                    prompt=cls._create_stretching_prompt(user_input),
                    headers=headers
                )
                
                return AIResponse(text=response)
                
        except asyncio.TimeoutError:
            logger.error("Request timed out due to semaphore limit")
            raise HTTPException(
                status_code=503,
                detail="서버가 너무 많은 요청을 처리중입니다. 잠시 후 다시 시도해주세요."
            )
        except Exception as e:
            logger.error(f"Error in generate_stretching_guide: {str(e)}", exc_info=True)
            raise

    @classmethod
    async def _get_api_response(
        cls,
        session_id: str,
        prompt: str,
        headers: dict
    ) -> str:
        """단일 API 요청 처리"""
        request_data = {
            "model": "helpy-pro",
            "sess_id": session_id,
            "temperature": 0.5,
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "system",
                    "content": "스트레칭 전문가입니다. 간단명료하게 답변하고, 검색 결과를 참고하세요."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        try:
            logger.info(f"Starting API request for session: {session_id}")
            start_time = time.time()
            
            async with cls.get_client() as client:
                logger.debug(f"Sending request to API: {request_data}")
                response = await client.post(
                    f"{cls.API_URL}/v1/chat/completions",
                    json=request_data,
                    headers=headers
                )
                
                elapsed_time = time.time() - start_time
                logger.info(f"API response received in {elapsed_time:.2f} seconds")

                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        message = response_data["choices"][0]["message"]
                        content = message.get("content", "").strip()
                        
                        if tool_calls := message.get("tool_calls"):
                            logger.info("Search performed:")
                            for call in tool_calls:
                                if call.get("type") == "function" and call.get("function", {}).get("name") == "search_google_for_query":
                                    logger.info(f"Query: {call['function']['arguments']}")
                        
                        return content if content else "응답이 비어있습니다. 다시 시도해주세요."

                    except Exception as e:
                        logger.error(f"Error parsing response: {str(e)}")
                        return "응답 처리 중 오류가 발생했습니다. 다시 시도해주세요."
                else:
                    logger.error(f"API Error: {response.status_code}")
                    return f"서버 오류 ({response.status_code}). 다시 시도해주세요."

        except Exception as e:
            logger.error(f"Error: {str(e)}")
            return "오류가 발생했습니다. 다시 시도해주세요." 