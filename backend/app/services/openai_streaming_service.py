from typing import Optional, List, Dict, Any, AsyncGenerator
import httpx
import logging
import json
import time
import asyncio
from contextlib import asynccontextmanager

from app.core.config import settings
from app.schemas.user_input import UserInput
from app.schemas.ai_response import AIResponse, StreamingAIResponse
from app.services.helpy_pro_service import HelpyProService
from app.services.embedding_service import EmbeddingService

# 로거 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class OpenAIStreamingService:
    """OpenAI API를 사용한 스트리밍 서비스 클래스"""

    API_URL = "https://api.openai.com"
    API_KEY = settings.OPENAI_API_KEY
    MAX_TOKENS = 2048
    
    # 동시 요청 제어를 위한 세마포어
    _semaphore = asyncio.Semaphore(50)  # 최대 50개의 동시 요청 허용
    
    @classmethod
    def _get_system_prompt(cls) -> str:
        """시스템 프롬프트 생성"""
        return """당신은 스트레칭 전문가이자 물리치료사입니다. 
JSON 형식으로 제공된 사용자 데이터와 관련 스트레칭 정보를 활용해 분석과 가이드를 제공하세요.

다음 원칙을 따라주세요:
1. 제공된 메타데이터를 최대한 활용하여 상세하고 정확한 스트레칭 가이드를 작성하세요.
2. 학술적 근거가 있는 경우 반드시 포함하고 출처를 명시하세요.
3. 사용자의 상태, 직업, 생활 습관을 고려한 맞춤형 가이드를 제공하세요.
4. 각 스트레칭 동작에 대해 단계별 지침, 호흡법, 반복 횟수를 명확히 설명하세요.
5. 필요한 경우 추가 정보를 찾아 포함하세요.
6. 참고 자료 섹션에 사용된 학술 자료나 스트레칭 정보의 출처 URL을 포함하세요.

응답 형식:
[분석]
- 상태: (사용자의 현재 상태 분석)
- 위험: (지속될 경우의 위험 요소)
- 개선점: (개선을 위한 방향)

[가이드]
- 스트레칭: (구체적인 스트레칭 방법 3-5개)
- 생활수칙: (일상생활에서의 개선 방법)
- 주의사항: (스트레칭 시 주의할 점)

[참고 자료]
- (사용된 학술 자료 및 출처 URL)"""
    
    @classmethod
    async def generate_stretching_guide_stream(
        cls, 
        session_id: str,
        stretching_id: str,
        user_input: UserInput,
        relevant_exercises: List[Dict[str, Any]] = None,
        temp_session_service = None,
        user_service = None,
        current_user = None
    ) -> AsyncGenerator[StreamingAIResponse, None]:
        """스트레칭 가이드 생성 (스트리밍 방식)"""
        try:
            logger.info(f"Generating streaming stretching guide with OpenAI for session: {session_id}")
            
            # 임베딩 검색 결과가 없는 경우 검색 수행
            if not relevant_exercises or len(relevant_exercises) == 0:
                logger.info("임베딩 검색 수행 중...")
                body_parts = [part.strip() for part in user_input.selected_body_parts.split(',')]
                relevant_exercises = await EmbeddingService.search(
                    query=user_input.pain_description,
                    body_parts=body_parts,
                    occupation=user_input.occupation,
                    top_k=3
                )
                logger.info(f"임베딩 검색 완료: {len(relevant_exercises)}개 결과 찾음")
                # 검색 결과 로깅
                for i, exercise in enumerate(relevant_exercises):
                    logger.debug(f"검색 결과 {i+1}: {exercise.get('exercise', {}).get('title', '제목 없음')} - 유사도: {exercise.get('similarity', 0)}")
            
            # 사용자 입력 및 관련 운동 정보를 기반으로 프롬프트 생성 (HelpyProService와 동일한 프롬프트 사용)
            prompt = HelpyProService._create_prompt(user_input, relevant_exercises)
            
            # 기본 응답 생성 (API 호출 실패 시 사용)
            default_response = HelpyProService._generate_default_response(user_input)
            default_first_line = default_response.split('\n')[0] if default_response else ""
            
            # 캐시 방지를 위한 타임스탬프 추가
            cache_buster = str(int(time.time()))
            
            # 헤더 설정
            api_headers = {
                "Authorization": f"Bearer {cls.API_KEY}",
                "Content-Type": "application/json"
            }
            
            # 세마포어를 사용하여 동시 요청 제한
            async with cls._semaphore:
                logger.info(f"Acquired semaphore for OpenAI streaming session: {session_id}")
                
                # API 요청 데이터 준비 (OpenAI 형식)
                request_data = {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "system",
                            "content": cls._get_system_prompt()
                        },
                        {
                            "role": "user",
                            "content": f"{prompt}\n\n(timestamp: {cache_buster})"
                        }
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1500,
                    "stream": True  # 스트리밍 활성화
                }
                
                # API 키가 비어있는지 확인
                if not cls.API_KEY:
                    logger.error("OpenAI API key is empty")
                    yield StreamingAIResponse(
                        content=default_first_line,
                        done=False
                    )
                    yield StreamingAIResponse(
                        content=default_response[len(default_first_line):],
                        done=True
                    )
                    return
                
                try:
                    # API 요청 보내기
                    async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                        logger.info(f"Sending OpenAI streaming API request for session: {session_id}")
                        
                        try:
                            # OpenAI 스트리밍 API 엔드포인트
                            stream_url = f"{cls.API_URL}/v1/chat/completions"
                            logger.debug(f"OpenAI Streaming API URL: {stream_url}")
                            
                            async with client.stream(
                                "POST",
                                stream_url,
                                json=request_data,
                                headers=api_headers
                            ) as response:
                                # 응답 상태 코드 확인
                                if response.status_code != 200:
                                    error_text = await response.aread()
                                    error_text = error_text.decode('utf-8')
                                    logger.error(f"OpenAI API error: {response.status_code}, {error_text}")
                                    yield StreamingAIResponse(
                                        content=default_first_line,
                                        done=False
                                    )
                                    yield StreamingAIResponse(
                                        content=default_response[len(default_first_line):],
                                        done=True
                                    )
                                    return
                                
                                # 스트리밍 응답 처리
                                full_response = ""
                                async for line in response.aiter_lines():
                                    if not line or line.strip() == "":
                                        continue
                                        
                                    if line.startswith("data: "):
                                        line = line[6:]  # "data: " 제거
                                        
                                    if line == "[DONE]":
                                        logger.debug("스트리밍 완료 신호 [DONE] 수신")
                                        break
                                        
                                    try:
                                        # JSON 파싱
                                        data = json.loads(line)
                                        
                                        # 콘텐츠 추출
                                        delta = data.get("choices", [{}])[0].get("delta", {})
                                        content = delta.get("content", "")
                                        
                                        if content:
                                            logger.debug(f"스트리밍 콘텐츠 추가 (길이: {len(content)})")
                                            full_response += content
                                            yield StreamingAIResponse(
                                                content=content,
                                                done=False
                                            )
                                    except json.JSONDecodeError:
                                        logger.warning(f"Failed to parse JSON: {line}")
                                        continue
                        except httpx.RequestError as e:
                            logger.error(f"HTTP request error: {str(e)}")
                            yield StreamingAIResponse(
                                content=default_response,
                                done=True
                            )
                            return
                        
                        # 스트리밍 완료 후 전체 응답 저장
                        if full_response:
                            logger.info(f"OpenAI streaming completed for session: {session_id}")
                            logger.debug(f"Full response length: {len(full_response)}")
                            
                            # 스트리밍 완료 신호 전송
                            yield StreamingAIResponse(
                                content="",
                                done=True
                            )
                            
                            # 필요한 경우 여기에 응답 저장 로직 추가
                            if temp_session_service and stretching_id:
                                try:
                                    # 세션 데이터 저장 (HelpyProService와 동일한 방식)
                                    await temp_session_service.update_session_data(
                                        session_id=session_id,
                                        stretching_id=stretching_id,
                                        ai_response=full_response,
                                        user_input=user_input
                                    )
                                    logger.info(f"Session data updated for session: {session_id}")
                                except Exception as e:
                                    logger.error(f"Failed to update session data: {str(e)}")
                
                except Exception as e:
                    logger.error(f"Error in OpenAI streaming: {str(e)}")
                    yield StreamingAIResponse(
                        content=default_response,
                        done=True
                    )
        
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI streaming: {str(e)}")
            yield StreamingAIResponse(
                content="서비스 연결에 문제가 발생했습니다. 다시 시도해주세요.",
                done=True
            ) 