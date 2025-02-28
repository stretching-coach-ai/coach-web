from typing import Optional, List, Dict, Any, AsyncGenerator
import httpx
import logging
from fastapi import HTTPException
import json
import time
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

from app.core.config import settings
from app.schemas.user_input import UserInput
from app.schemas.ai_response import AIResponse, StreamingAIResponse
from app.services.embedding_service import EmbeddingService

# 로거 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class HelpyProService:
    """Helpy Pro API와의 통신을 담당하는 서비스 클래스"""

    API_URL = settings.HELPY_PRO_API_URL
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
            cls._client_pool = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),  # 30초 타임아웃 설정
                limits=limits
            )
        
        try:
            yield cls._client_pool
        except Exception as e:
            logger.error(f"Error with HTTP client: {e}")
            raise

    @classmethod
    def _create_prompt(cls, user_input: UserInput, relevant_exercises: List[Dict[str, Any]] = None) -> str:
        """최적화된 스트레칭 가이드 생성을 위한 프롬프트"""
        
        # 사용자 기본 정보 포함
        user_data = {
            "pain_description": user_input.pain_description,
            "body_parts": user_input.selected_body_parts,
            "occupation": user_input.occupation,
            "age": getattr(user_input, "age", ""),
            "gender": getattr(user_input, "gender", "")
        }
        
        # 생활 습관 정보 추가
        lifestyle = getattr(user_input, "lifestyle", None)
        if lifestyle:
            # Convert LifestylePattern object to dictionary
            if hasattr(lifestyle, "model_dump"):
                user_data["lifestyle"] = lifestyle.model_dump()
            elif hasattr(lifestyle, "__dict__"):
                user_data["lifestyle"] = lifestyle.__dict__
            else:
                # Manually extract attributes if needed
                user_data["lifestyle"] = {
                    "work_hours": getattr(lifestyle, "work_hours", 0),
                    "sitting_hours": getattr(lifestyle, "sitting_hours", 0),
                    "exercise_frequency": getattr(lifestyle, "exercise_frequency", 0),
                    "sleep_hours": getattr(lifestyle, "sleep_hours", 0)
                }
        
        # 관련 스트레칭 정보 및 메타데이터 추출
        exercises_data = []
        if relevant_exercises and len(relevant_exercises) > 0:
            for item in relevant_exercises:
                exercise = item["exercise"]
                muscle = item["muscle"]
                similarity = item.get("similarity", 0)
                
                # URL 정보 추출
                source_url = ""
                if exercise.get("evidence") and exercise["evidence"].get("url"):
                    source_url = exercise["evidence"]["url"]
                
                # 기본 정보
                exercise_info = {
                    "title": exercise.get("title", "정보 없음"),
                    "muscle": muscle,
                    "similarity": f"{similarity:.2f}",
                    "source_url": source_url,
                    "steps": []
                }
                
                # 메타데이터 최대한 활용
                enhanced = exercise.get("enhanced_metadata", {})
                
                # 스트레칭 상세 정보
                stretching_details = enhanced.get("스트레칭_상세화", {})
                if stretching_details:
                    # 동작 단계
                    steps = stretching_details.get("동작_단계", [])
                    if steps:
                        exercise_info["steps"] = steps
                    
                    # 호흡 패턴
                    breathing = stretching_details.get("호흡_패턴", [])
                    if breathing:
                        exercise_info["breathing"] = breathing
                    
                    # 느껴야 할 감각
                    feeling = stretching_details.get("느껴야_할_감각", "")
                    if feeling:
                        exercise_info["feeling"] = feeling
                    
                    # 반복 횟수 및 시간
                    repetition = stretching_details.get("반복_횟수_및_시간", "")
                    if repetition:
                        exercise_info["repetition"] = repetition
                
                # 효과 정보
                effects = enhanced.get("효과_및_이점", {})
                if effects:
                    exercise_info["effects"] = effects
                
                # 안전 및 주의사항
                safety = enhanced.get("안전_및_주의사항", {})
                if safety:
                    exercise_info["safety"] = safety
                
                # 학술적 근거
                scientific_basis = enhanced.get("학술적_근거", {})
                if scientific_basis:
                    exercise_info["scientific_basis"] = scientific_basis
                
                exercises_data.append(exercise_info)
        
        # 최종 프롬프트 구성 (JSON 형식)
        prompt_data = {
            "user": user_data,
            "exercises": exercises_data,
            "instructions": {
                "format": {
                    "analysis": ["상태", "위험", "개선점"],
                    "guide": ["스트레칭", "생활수칙", "주의사항"],
                    "references": "참고 자료 및 출처"
                },
                "requirements": [
                    "제공된 메타데이터를 최대한 활용하여 상세한 스트레칭 가이드를 작성하세요.",
                    "학술적 근거가 있는 경우 포함하고 출처를 명시하세요.",
                    "필요한 경우 Google 검색 기능을 사용하여 추가 정보를 찾으세요.",
                    "사용자의 상태, 직업, 생활 습관을 고려한 맞춤형 가이드를 제공하세요.",
                    "각 스트레칭 동작에 대해 단계별 지침, 호흡법, 반복 횟수를 명확히 설명하세요.",
                    "참고 자료 섹션에는 실제 URL이 있는 경우에만 포함하세요. URL이 없는 경우 출처 링크 필요와 같은 텍스트를 사용하지 말고, 해당 참고 자료는 생략하세요."
                ]
            }
        }
        
        # JSON 문자열로 변환
        return json.dumps(prompt_data, ensure_ascii=False)

    @classmethod
    async def generate_stretching_guide(
        cls, 
        session_id: str,
        user_input: UserInput,
        relevant_exercises: List[Dict[str, Any]] = None
    ) -> AIResponse:
        """스트레칭 가이드 생성"""
        headers = {}

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
                # 검색 결과 로깅
                for i, exercise in enumerate(relevant_exercises):
                    logger.debug(f"검색 결과 {i+1}: {exercise.get('exercise', {}).get('title', '제목 없음')} - 유사도: {exercise.get('similarity', 0)}")
            
            # 세마포어를 사용하여 동시 요청 제어
            async with cls._semaphore:
                logger.info(f"Generating stretching guide for session_id: {session_id}")
                
                # 프롬프트 생성 - 최적화된 프롬프트 메서드 사용
                prompt = cls._create_prompt(user_input, relevant_exercises)
                logger.debug(f"Generated optimized prompt length: {len(prompt)} characters")
                logger.debug(f"Prompt first 300 chars: {prompt[:300]}...")
                logger.debug(f"Prompt last 300 chars: {prompt[-300:]}...")
                
                # API 요청 전 환경 변수 확인
                logger.debug(f"API URL: {cls.API_URL}")
                masked_key = cls.API_KEY[:5] + "..." + cls.API_KEY[-5:] if len(cls.API_KEY) > 10 else "***"
                logger.debug(f"API Key (masked): {masked_key}")
                
                # API 요청
                response = await cls._get_api_response(
                    session_id=session_id,
                    prompt=prompt,
                    headers=headers
                )
                
                # 상세 로깅 추가
                response_preview = response[:200] + "..." if len(response) > 200 else response
                logger.debug(f"API response preview: {response_preview}")
                
                # 기본 응답 감지를 위한 체크
                default_response = cls._generate_default_response(user_input)
                default_first_line = default_response.split('\n')[0]
                response_first_line = response.split('\n')[0] if '\n' in response else response[:50]
                
                # API 응답이 오류 메시지를 포함하는 경우에만 기본 응답 제공
                error_phrases = [
                    "오류가 발생했습니다", 
                    "API 키가 설정되지 않았습니다",
                    "서버 오류",
                    "응답이 비어있습니다",
                    "API 요청 시간이 초과되었습니다",
                    "API 응답 형식이 올바르지 않습니다",
                    "응답 처리 중 오류가 발생했습니다"
                ]
                
                is_error_response = any(phrase in response for phrase in error_phrases)
                
                if is_error_response:
                    logger.warning(f"API 응답에 오류가 포함되어 있어 기본 응답을 제공합니다: {response}")
                    return AIResponse(text=default_response)
                
                # 기본 응답과 일치하는지 확인
                similarity_check = response_first_line == default_first_line
                if similarity_check:
                    logger.warning(f"API 응답이 기본 응답과 유사합니다. 첫 줄 비교: '{response_first_line}' vs '{default_first_line}'")
                    
                    # 응답 내용 추가 검사
                    if "※ 현재 서비스 연결에 일시적인 문제가 있어 기본 가이드를 제공합니다" in response:
                        logger.error("API 응답이 기본 응답 메시지를 포함하고 있습니다. API 호출에 문제가 있습니다.")
                        # 여기서 기본 응답을 반환하지 않고 API 응답을 그대로 반환하여 문제 진단
                        logger.error(f"전체 API 응답: {response}")
                        
                        # API 키와 URL 확인 로깅
                        logger.error(f"API URL: {cls.API_URL}")
                        logger.error(f"API Key 설정됨: {'예' if cls.API_KEY else '아니오'}")
                        
                        # 기본 응답 반환
                        return AIResponse(text=default_response)
                
                logger.info("API 응답이 성공적으로 생성되었습니다.")
                return AIResponse(text=response)
                
        except asyncio.TimeoutError:
            logger.error("Request timed out due to semaphore limit")
            raise HTTPException(
                status_code=503,
                detail="서버가 너무 많은 요청을 처리중입니다. 잠시 후 다시 시도해주세요."
            )
        except Exception as e:
            logger.error(f"Error in generate_stretching_guide: {str(e)}", exc_info=True)
            # 예외 발생 시에도 기본 응답 제공
            default_response = cls._generate_default_response(user_input)
            return AIResponse(text=default_response)

    @classmethod
    def _generate_default_response(cls, user_input: UserInput) -> str:
        """API 응답 실패 시 기본 응답 생성"""
        body_parts = user_input.selected_body_parts
        occupation = user_input.occupation
        pain_description = user_input.pain_description
        
        return f"""[분석]
- 상태: {occupation}으로 인한 {body_parts} 부위의 통증이 있습니다. 장시간 같은 자세 유지로 인한 근육 긴장이 주요 원인으로 보입니다.
- 위험: 지속적인 통증은 만성화될 수 있으며, 자세 불균형과 근육 약화로 이어질 수 있습니다.
- 개선점: 규칙적인 스트레칭과 자세 교정, 적절한 휴식이 필요합니다.

[가이드]
- 스트레칭:
  1. 목 스트레칭: 천천히 목을 좌우로 기울이고 15초간 유지, 3회 반복
  2. 어깨 돌리기: 어깨를 앞뒤로 크게 원을 그리며 10회씩 회전
  3. 가슴 펴기: 양팔을 뒤로 깍지 끼고 가슴을 펴서 15초 유지, 3회 반복

- 생활수칙:
  1. 1시간마다 5분씩 자리에서 일어나 스트레칭
  2. 모니터 높이를 눈높이에 맞게 조정
  3. 의자에 허리 받침을 사용하여 바른 자세 유지

- 주의사항:
  1. 통증이 심해지면 즉시 중단하고 전문가와 상담하세요
  2. 스트레칭은 천천히 부드럽게 수행하세요
  3. 무리한 운동은 피하고 점진적으로 강도를 높이세요

※ 현재 서비스 연결에 일시적인 문제가 있어 기본 가이드를 제공합니다. 보다 맞춤형 가이드는 잠시 후 다시 시도해주세요."""

    @classmethod
    async def _get_api_response(
        cls,
        session_id: str,
        prompt: str,
        headers: dict
    ) -> str:
        """단일 API 요청 처리"""
        # 캐시 방지를 위한 타임스탬프 추가
        cache_buster = str(int(time.time()))
        
        request_data = {
            "model": "helpy-pro",
            "sess_id": f"{session_id}_{cache_buster}",  # 캐시 방지를 위한 세션 ID 수정
            "temperature": 0.3,  # 온도를 낮게 유지하여 일관된 응답 생성
            "max_tokens": 1500,  # 토큰 수 유지
            "messages": [
                {
                    "role": "system",
                    "content": """당신은 스트레칭 전문가이자 물리치료사입니다. 
JSON 형식으로 제공된 사용자 데이터와 관련 스트레칭 정보를 활용해 분석과 가이드를 제공하세요.

다음 원칙을 따라주세요:
1. 제공된 메타데이터를 최대한 활용하여 상세하고 정확한 스트레칭 가이드를 작성하세요.
2. 학술적 근거가 있는 경우 반드시 포함하고 출처를 명시하세요.
3. 사용자의 상태, 직업, 생활 습관을 고려한 맞춤형 가이드를 제공하세요.
4. 각 스트레칭 동작에 대해 단계별 지침, 호흡법, 반복 횟수를 명확히 설명하세요.
5. 필요한 경우 Google 검색 기능을 사용하여 추가 정보를 찾으세요
6. 참고 자료 섹션에는 실제 URL이 있는 경우에만 포함하세요. URL이 없는 경우 "[출처 링크 필요]"와 같은 텍스트를 사용하지 말고, 해당 참고 자료는 생략하세요.
7. 모든 응답은 한국어로만 작성하세요. 영어 용어(예: 'effects', 'scientific basis' 등)를 사용하지 마세요.
8. 논문 제목이나 출처 정보에서 영어 부분은 제거하거나 한국어로 간략하게 요약하세요.

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
- (실제 URL이 있는 학술 자료만 포함, URL이 없는 경우 생략)"""
                },
                {
                    "role": "user",
                    "content": f"{prompt}\n\n(timestamp: {cache_buster})"  # 캐시 방지를 위한 타임스탬프 추가
                }
            ],
            "tools": [
                {
                    "type": "function",
                    "function": {
                        "name": "search_google_for_query",
                        "description": "Search Google for additional information about stretching exercises, medical conditions, or scientific evidence",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The search query"
                                }
                            },
                            "required": ["query"]
                        }
                    }
                }
            ],
            "response_format": {"type": "text"}  # 명시적으로 텍스트 응답 형식 지정
        }

        try:
            logger.info(f"Starting API request for session: {session_id} with cache buster: {cache_buster}")
            start_time = time.time()
            
            # API 키가 비어있는지 확인
            if not cls.API_KEY:
                logger.error("API key is empty. Please set HELPY_PRO_API_KEY in environment variables.")
                return "API 키가 설정되지 않았습니다. 관리자에게 문의하세요."
            
            # API URL 확인
            if not cls.API_URL or not cls.API_URL.startswith("http"):
                logger.error(f"Invalid API URL: {cls.API_URL}")
                return "API URL이 올바르지 않습니다. 관리자에게 문의하세요."
            
            # 헤더에 API 키 설정
            api_headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "authorization": f"Bearer {cls.API_KEY}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",  
                "Expires": "0" 
            }
            
            # API 키 로깅 (마스킹 처리)
            masked_key = cls.API_KEY[:5] + "..." + cls.API_KEY[-5:] if len(cls.API_KEY) > 10 else "***"
            logger.debug(f"Using API key: {masked_key}")
            logger.debug(f"API URL: {cls.API_URL}")
            
            async with cls.get_client() as client:
                logger.debug(f"Sending enhanced request to API with Google search capability")
                
                # 요청 데이터 로깅 (민감 정보 제외)
                log_request = request_data.copy()
                log_request["messages"] = [{"role": m["role"], "content_length": len(m["content"])} for m in request_data["messages"]]
                logger.debug(f"Request data: {json.dumps(log_request)}")
                
                try:
                    # 명시적 타임아웃 설정 (45초)
                    response = await client.post(
                        f"{cls.API_URL}/v1/chat/completions?cache_buster={cache_buster}", 
                        json=request_data,
                        headers=api_headers,
                        timeout=45.0
                    )
                    
                    elapsed_time = time.time() - start_time
                    logger.info(f"API response received in {elapsed_time:.2f} seconds with status code: {response.status_code}")
                    
                    # 응답 헤더 로깅
                    logger.debug(f"Response headers: {dict(response.headers)}")
                    
                    if response.status_code == 200:
                        try:
                            response_data = response.json()
                            logger.debug(f"Response structure: {list(response_data.keys())}")
                            
                            if "choices" not in response_data or not response_data["choices"]:
                                logger.error("No choices in response data")
                                logger.error(f"Full response data: {json.dumps(response_data)}")
                                return "API 응답 형식이 올바르지 않습니다. 다시 시도해주세요."
                            
                            message = response_data["choices"][0]["message"]
                            content = message.get("content", "").strip()
                            
                            # 검색 도구 호출 로깅
                            if tool_calls := message.get("tool_calls"):
                                logger.info(f"Search performed: {len(tool_calls)} queries")
                                for call in tool_calls:
                                    if call.get("type") == "function" and call.get("function", {}).get("name") == "search_google_for_query":
                                        try:
                                            args = json.loads(call["function"]["arguments"])
                                            query = args.get("query", "")
                                            logger.info(f"Search query: {query}")
                                        except Exception as e:
                                            logger.error(f"Error parsing search arguments: {str(e)}")
                            
                            if not content:
                                logger.warning("Empty content in response")
                                logger.error(f"Full response message: {json.dumps(message)}")
                                return "응답이 비어있습니다. 다시 시도해주세요."
                            
                            # 응답 내용 검증
                            if content.startswith("[분석]") and "상태:" in content:
                                logger.info("Response format validation passed")
                            else:
                                logger.warning(f"Response format validation failed. Response does not start with expected format.")
                                logger.warning(f"Response starts with: {content[:50]}...")
                            
                            # 타임스탬프 제거 (응답에 포함되었을 경우)
                            if f"timestamp: {cache_buster}" in content:
                                content = content.replace(f"timestamp: {cache_buster}", "").strip()
                            
                            logger.debug(f"Response content length: {len(content)}")
                            return content
                        
                        except json.JSONDecodeError as e:
                            logger.error(f"JSON decode error: {str(e)}")
                            logger.error(f"Raw response: {response.text[:500]}")
                            return "응답 형식이 올바르지 않습니다. 다시 시도해주세요."
                        except Exception as e:
                            logger.error(f"Error parsing response: {str(e)}")
                            logger.error(f"Exception type: {type(e).__name__}")
                            logger.error(f"Raw response text: {response.text[:500]}")
                            return "응답 처리 중 오류가 발생했습니다. 다시 시도해주세요."
                    else:
                        logger.error(f"API Error: {response.status_code}")
                        try:
                            error_content = response.text
                            logger.error(f"Error content: {error_content[:500]}")
                        except:
                            pass
                        return f"서버 오류 ({response.status_code}). 다시 시도해주세요."
                
                except httpx.ReadTimeout:
                    logger.error("API request read timeout")
                    return "API 응답 대기 시간이 초과되었습니다. 다시 시도해주세요."
                except httpx.ConnectTimeout:
                    logger.error("API connection timeout")
                    return "API 연결 시간이 초과되었습니다. 다시 시도해주세요."
                except httpx.RequestError as e:
                    logger.error(f"Request error: {str(e)}")
                    return f"API 요청 오류: {str(e)}. 다시 시도해주세요."

        except httpx.TimeoutException:
            logger.error("API request timed out")
            return "API 요청 시간이 초과되었습니다. 다시 시도해주세요."
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return "오류가 발생했습니다. 다시 시도해주세요."

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
            logger.info(f"Generating streaming stretching guide for session: {session_id}")
            
            # 사용자 입력 및 관련 운동 정보를 기반으로 프롬프트 생성
            prompt = cls._create_prompt(user_input, relevant_exercises)
            
            # 기본 응답 생성 (API 호출 실패 시 사용)
            default_response = cls._generate_default_response(user_input)
            default_first_line = default_response.split('\n')[0] if default_response else ""
            
            # 캐시 방지를 위한 타임스탬프 추가
            cache_buster = str(int(time.time()))
            
            # 헤더 설정 - 일반 API 요청과 동일하게 설정
            api_headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "authorization": f"Bearer {cls.API_KEY}",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
            
            # 세마포어를 사용하여 동시 요청 제한
            async with cls._semaphore:
                logger.info(f"Acquired semaphore for session: {session_id}")
                
                # API 요청 데이터 준비
                request_data = {
                    "model": "helpy-pro",
                    "sess_id": f"{session_id}_{cache_buster}",
                    "temperature": 0.3,
                    "max_tokens": 1500,
                    "stream": True,  # 스트리밍 활성화
                    "messages": [
                        {
                            "role": "system",
                            "content": """당신은 스트레칭 전문가이자 물리치료사입니다. 
JSON 형식으로 제공된 사용자 데이터와 관련 스트레칭 정보를 활용해 분석과 가이드를 제공하세요.

다음 원칙을 따라주세요:
1. 제공된 메타데이터를 최대한 활용하여 상세하고 정확한 스트레칭 가이드를 작성하세요.
2. 학술적 근거가 있는 경우 반드시 포함하고 출처를 명시하세요.
3. 사용자의 상태, 직업, 생활 습관을 고려한 맞춤형 가이드를 제공하세요.
4. 각 스트레칭 동작에 대해 단계별 지침, 호흡법, 반복 횟수를 명확히 설명하세요.
5. 필요한 경우 Google 검색 기능을 사용하여 추가 정보를 찾으세요.
6. 참고 자료 섹션에는 실제 URL이 있는 경우에만 포함하세요. URL이 없는 경우 출처 링크 필요와 같은 텍스트를 사용하지 말고, 해당 참고 자료는 생략하세요.
7. 모든 응답은 한국어로만 작성하세요. 영어 용어(예: 'effects', 'scientific basis' 등)를 사용하지 마세요.
8. 논문 제목이나 출처 정보에서 영어 부분은 제거하거나 한국어로 간략하게 요약하세요.

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
- (실제 URL이 있는 학술 자료만 포함, URL이 없는 경우 생략)"""
                        },
                        {
                            "role": "user",
                            "content": f"{prompt}\n\n(timestamp: {cache_buster})"
                        }
                    ],
                    "tools": [
                        {
                            "type": "function",
                            "function": {
                                "name": "search_google_for_query",
                                "description": "Search Google for additional information about stretching exercises, medical conditions, or scientific evidence",
                                "parameters": {
                                    "type": "object",
                                    "properties": {
                                        "query": {
                                            "type": "string",
                                            "description": "The search query"
                                        }
                                    },
                                    "required": ["query"]
                                }
                            }
                        }
                    ],
                    "response_format": {"type": "text"}
                }
                
                # API 키가 비어있는지 확인
                if not cls.API_KEY:
                    logger.error("API key is empty")
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
                    # 리다이렉트를 자동으로 따르도록 설정
                    async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                        logger.info(f"Sending streaming API request for session: {session_id}")
                        
                        try:
                            # URL 형식을 일반 API 요청과 동일하게 설정
                            stream_url = f"{cls.API_URL}/v1/chat/completions?cache_buster={cache_buster}"
                            logger.debug(f"Streaming API URL: {stream_url}")
                            
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
                                    logger.error(f"API error: {response.status_code}, {error_text}")
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
                                        logger.debug(f"파싱 시도: {line[:100]}...")
                                        data = json.loads(line)
                                        
                                        # 콘텐츠 추출
                                        delta = data.get("choices", [{}])[0].get("delta", {})
                                        content = delta.get("content", "")
                                        
                                        if content:
                                            logger.debug(f"스트리밍 콘텐츠 추가 (길이: {len(content)}): {content[:50]}...")
                                            full_response += content
                                            yield StreamingAIResponse(
                                                content=content,
                                                done=False
                                            )
                                            logger.debug("StreamingAIResponse 객체 전송 완료")
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
                            logger.info(f"Streaming completed for session: {session_id}")
                            logger.debug(f"Full response length: {len(full_response)}")
                            logger.debug(f"Full response preview: {full_response[:200]}...")
                            
                            # 임시 세션에 AI 응답 저장
                            if temp_session_service:
                                logger.info("Updating stretching AI response in temp session")
                                await temp_session_service.update_stretching_ai_response(
                                    session_id=session_id,
                                    stretching_id=stretching_id,
                                    ai_response=full_response
                                )
                            
                            # 로그인한 사용자의 경우 히스토리에도 저장
                            if current_user and user_service:
                                logger.info(f"Saving stretching session to user history: {current_user.id}")
                                # 완성된 스트레칭 세션 객체 생성
                                from app.schemas.session import StretchingSession
                                stretching_session = StretchingSession(
                                    id=stretching_id,
                                    created_at=datetime.utcnow(),
                                    user_input=user_input,
                                    ai_response=full_response
                                )
                                
                                # 사용자 히스토리에 저장
                                await user_service.add_stretching_session(
                                    user_id=current_user.id,
                                    stretching_session=stretching_session.model_dump()
                                )
                            
                            # 완료 신호 전송
                            logger.debug("Sending final done signal")
                            yield StreamingAIResponse(
                                content="",
                                done=True
                            )
                            logger.debug("Stream completed successfully")
                        else:
                            logger.warning(f"Empty response for session: {session_id}")
                            yield StreamingAIResponse(
                                content=default_response,
                                done=True
                            )
                            
                except Exception as e:
                    logger.error(f"API request error: {str(e)}")
                    yield StreamingAIResponse(
                        content=default_response,
                        done=True
                    )
                
        except Exception as e:
            logger.error(f"Error in generate_stretching_guide_stream: {str(e)}")
            yield StreamingAIResponse(
                content="오류가 발생했습니다. 다시 시도해주세요.",
                done=True
            ) 