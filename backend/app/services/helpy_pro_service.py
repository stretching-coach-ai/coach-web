from typing import Optional, List, Dict, Any
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
from app.services.embedding_service import EmbeddingService

# 로거 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class HelpyProService:
    """Helpy Pro API와의 통신을 담당하는 서비스 클래스"""

    API_URL = "https://api-cloud-function.elice.io/9f071d94-a459-429d-a375-9601e521b079"
    API_KEY = settings.HELPY_PRO_API_KEY
    MAX_TOKENS = 2048
    
    # 동시 요청 제어를 위한 세마포어
    _semaphore = asyncio.Semaphore(50)  # 최대 50개의 동시 요청 허용
    
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
    def _create_stretching_prompt(cls, user_input: UserInput, relevant_exercises: List[Dict[str, Any]] = None) -> str:
        """스트레칭 가이드 생성을 위한 통합 프롬프트"""
        
        # 기본 프롬프트
        prompt = f"""사용자 데이터를 분석하고 스트레칭 가이드를 제공해주세요.

데이터: {user_input.model_dump_json()}

검색어: "{user_input.selected_body_parts} 스트레칭"
"""

        # 관련 스트레칭 정보가 있는 경우 추가
        if relevant_exercises and len(relevant_exercises) > 0:
            prompt += "\n참고할 스트레칭 정보:\n"
            
            for i, item in enumerate(relevant_exercises, 1):
                exercise = item["exercise"]
                muscle = item["muscle"]
                similarity = item.get("similarity", 0)
                
                # 기본 정보
                prompt += f"\n[스트레칭 {i} - {muscle}] (유사도: {similarity:.2f})\n"
                prompt += f"제목: {exercise.get('title', '정보 없음')}\n"
                
                # 스트레칭 상세 정보
                enhanced = exercise.get("enhanced_metadata", {})
                stretching_details = enhanced.get("스트레칭_상세화", {})
                
                if stretching_details:
                    # 동작 단계
                    steps = stretching_details.get("동작_단계", [])
                    if steps:
                        prompt += "동작 단계:\n"
                        for step in steps:
                            prompt += f"- {step}\n"
                    
                    # 호흡 패턴
                    breathing = stretching_details.get("호흡_패턴", [])
                    if breathing:
                        prompt += "호흡 패턴:\n"
                        for breath in breathing:
                            prompt += f"- {breath}\n"
                    
                    # 느껴야 할 감각
                    feeling = stretching_details.get("느껴야_할_감각", "")
                    if feeling:
                        prompt += f"느껴야 할 감각: {feeling}\n"
                
                # 주의사항
                safety = enhanced.get("안전_및_주의사항", {})
                if safety:
                    cautions = safety.get("수행_시_주의점", [])
                    if cautions:
                        prompt += "주의사항:\n"
                        for caution in cautions:
                            prompt += f"- {caution}\n"

        # 응답 형식 지정
        prompt += """
다음 형식으로 답변을 구성하세요:
[분석]
- 상태/위험/개선점

[가이드]
- 스트레칭
- 생활수칙
- 주의사항

답변에 제공된 스트레칭 정보를 반드시 참조하고, 필요한 경우 Google 검색을 활용하세요."""

        return prompt

    @classmethod
    async def generate_stretching_guide(
        cls, 
        session_id: str,
        user_input: UserInput,
        relevant_exercises: List[Dict[str, Any]] = None
    ) -> AIResponse:
        """스트레칭 가이드 생성"""
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "Authorization": f"Bearer {cls.API_KEY}"
        }

        try:
            # 임베딩 검색 결과가 없는 경우 검색 수행
            if not relevant_exercises:
                logger.info("임베딩 검색 수행 중...")
                body_parts = [part.strip() for part in user_input.selected_body_parts.split(',')]
                relevant_exercises = await EmbeddingService.search(
                    query=user_input.pain_description,
                    body_parts=body_parts,
                    occupation=user_input.occupation,
                    top_k=3
                )
                logger.info(f"임베딩 검색 완료: {len(relevant_exercises)}개 결과 찾음")
            
            # 세마포어를 사용하여 동시 요청 제어
            async with cls._semaphore:
                logger.info(f"Generating stretching guide for session_id: {session_id}")
                
                # 프롬프트 생성
                prompt = cls._create_stretching_prompt(user_input, relevant_exercises)
                logger.debug(f"Generated prompt: {prompt[:500]}...")
                
                # API 요청
                response = await cls._get_api_response(
                    session_id=session_id,
                    prompt=prompt,
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