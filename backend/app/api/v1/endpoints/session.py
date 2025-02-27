from uuid import uuid4
import logging
from fastapi import APIRouter, Response, HTTPException, Cookie, Depends
from fastapi.responses import StreamingResponse
from app.services.temp_session_service import TempSessionService
from app.services.helpy_pro_service import HelpyProService
from app.services.openai_streaming_service import OpenAIStreamingService
from app.services.user_service import UserService
from app.schemas.user_input import UserInput
from app.schemas.ai_response import AIResponse, StreamingAIResponse
from app.schemas.session import StretchingSession
from app.schemas.user import UserResponse
from app.services.embedding_service import EmbeddingService
from app.api.v1.dependencies import get_current_user
import json
import re
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter()
user_service = UserService()

# 영어 콘텐츠 필터링 유틸리티 함수 추가
def is_english_content(text: str) -> bool:
    """
    텍스트가 영어 콘텐츠인지 확인하는 함수
    
    Args:
        text: 확인할 텍스트
        
    Returns:
        영어 콘텐츠이면 True, 아니면 False
    """
    if not text or not isinstance(text, str):
        return False
        
    # 영어 문자 비율 계산
    english_char_count = sum(1 for c in text if (ord('a') <= ord(c.lower()) <= ord('z')))
    total_char_count = len(text)
    
    # 영어 문자 비율이 40% 이상이면 영어 콘텐츠로 판단
    if total_char_count > 0 and english_char_count / total_char_count > 0.4:
        return True
        
    # 영어 문장 패턴 확인 (대문자로 시작하고 영어 단어가 연속으로 나오는 경우)
    if re.search(r'[A-Z][a-z]+\s+[a-z]+\s+[a-z]+', text):
        return True
        
    # 학술 용어 패턴 확인
    academic_terms = ['study', 'effect', 'impact', 'research', 'analysis', 'result', 'conclusion', 'method', 'objective']
    if any(term in text.lower() for term in academic_terms):
        return True
        
    # 일반적인 영어 단어 패턴 확인
    common_words = ['the', 'a', 'an', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were']
    if any(f' {word} ' in f' {text.lower()} ' for word in common_words):
        return True
        
    return False

@router.post("/sessions", status_code=201)
async def create_session(response: Response):
    """새로운 세션 생성"""
    # UUID를 사용하여 고유한 session_id 생성
    session_id = str(uuid4())
    session = await TempSessionService.create_session(session_id)
    # 쿠키 설정 (SameSite=Lax로 설정하여 보안 강화)
    response.set_cookie(
        key="session_id", 
        value=session.session_id, 
        httponly=True,
        samesite="lax"
    )
    return {"session_id": session.session_id}

@router.get("/sessions/current")
async def get_current_session(session_cookie: Optional[str] = Cookie(None, alias="session_id")):
    """현재 세션 정보 조회"""
    if not session_cookie:
        raise HTTPException(status_code=401, detail="활성화된 세션이 없습니다")
    
    logger.info(f"세션 쿠키 값: {session_cookie}")
    session = await TempSessionService.get_session(session_cookie)
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")
    return session

@router.post("/sessions/{session_id}/stretching", response_model=AIResponse)
async def create_stretching_session(
    session_id: str,
    user_input: UserInput,
    current_user: UserResponse = Depends(get_current_user)
):
    """새로운 스트레칭 세션 생성 및 AI 가이드 생성"""
    try:
        logger.info(f"Creating stretching session for session_id: {session_id}")
        logger.debug(f"User input: {user_input.model_dump()}")
        
        # 0. 임베딩 서비스 초기화 확인
        await EmbeddingService.initialize()
        
        # 1. 임베딩 검색으로 관련 스트레칭 찾기
        logger.info("Searching for relevant stretching exercises")
        body_parts = [part.strip() for part in user_input.selected_body_parts.split(',')]
        relevant_exercises = await EmbeddingService.search(
            query=user_input.pain_description,
            body_parts=body_parts,
            occupation=user_input.occupation,
            top_k=3
        )
        
        logger.info(f"Found {len(relevant_exercises)} relevant exercises")
        
        # 2. AI 가이드 생성
        ai_response = await HelpyProService.generate_stretching_guide(
            session_id=session_id,
            user_input=user_input,
            relevant_exercises=relevant_exercises
        )
        
        logger.info("AI guide generated successfully")
        
        # 3. 세션에 스트레칭 기록 추가
        logger.info("Adding stretching session to database")
        updated_session = await TempSessionService.add_stretching_session(
            session_id=session_id,
            user_input=user_input
        )
        
        if not updated_session:
            logger.error(f"Session not found: {session_id}")
            raise HTTPException(status_code=404, detail="Session not found")
        
        # 4. 생성된 스트레칭 세션의 ID 찾기
        latest_stretching = updated_session.stretching_sessions[-1]
        logger.info(f"Created stretching session with ID: {latest_stretching.id}")
        
        # 5. AI 응답 저장
        logger.info("Updating stretching AI response")
        await TempSessionService.update_stretching_ai_response(
            session_id=session_id,
            stretching_id=latest_stretching.id,
            ai_response=ai_response.text
        )
        
        # 6. 로그인한 사용자의 경우 히스토리에도 저장
        if current_user:
            logger.info(f"Saving stretching session to user history: {current_user.id}")
            # 완성된 스트레칭 세션 객체 생성
            stretching_session = StretchingSession(
                id=latest_stretching.id,
                created_at=latest_stretching.created_at,
                user_input=user_input,
                ai_response=ai_response.text
            )
            
            # 사용자 히스토리에 저장
            await user_service.add_stretching_session(
                user_id=current_user.id,
                stretching_session=stretching_session.model_dump()
            )
        
        return ai_response
        
    except Exception as e:
        logger.error(f"Error in create_stretching_session: {str(e)}", exc_info=True)
        raise

@router.post("/sessions/{session_id}/stretching/{stretching_id}/feedback")
async def update_stretching_feedback(
    session_id: str,
    stretching_id: str,
    feedback: str
):
    """스트레칭 세션에 피드백 추가"""
    updated = await TempSessionService.update_stretching_feedback(
        session_id=session_id,
        stretching_id=stretching_id,
        feedback=feedback
    )
    
    if not updated:
        raise HTTPException(status_code=404, detail="Session or stretching session not found")
    
    return {"status": "success"}

@router.post("/sessions/{session_id}/stretching/stream")
async def create_stretching_session_stream(
    session_id: str,
    user_input: UserInput,
    current_user: UserResponse = Depends(get_current_user)
):
    """새로운 스트레칭 세션 생성 및 AI 가이드 생성 (스트리밍 방식)"""
    try:
        logger.info(f"Creating streaming stretching session for session_id: {session_id}")
        logger.debug(f"User input: {user_input.model_dump()}")
        
        # 0. 임베딩 서비스 초기화 확인
        await EmbeddingService.initialize()
        
        # 1. 임베딩 검색으로 관련 스트레칭 찾기
        logger.info("Searching for relevant stretching exercises")
        body_parts = [part.strip() for part in user_input.selected_body_parts.split(',')]
        relevant_exercises = await EmbeddingService.search(
            query=user_input.pain_description,
            body_parts=body_parts,
            occupation=user_input.occupation,
            top_k=3
        )
        
        logger.info(f"Found {len(relevant_exercises)} relevant exercises")
        
        # 2. 세션에 스트레칭 기록 추가
        logger.info("Adding stretching session to database")
        updated_session = await TempSessionService.add_stretching_session(
            session_id=session_id,
            user_input=user_input
        )
        
        if not updated_session:
            logger.error(f"Session not found: {session_id}")
            raise HTTPException(status_code=404, detail="Session not found")
        
        # 3. 생성된 스트레칭 세션의 ID 찾기
        latest_stretching = updated_session.stretching_sessions[-1]
        stretching_id = latest_stretching.id
        logger.info(f"Created stretching session with ID: {stretching_id}")
        
        # 4. AI 가이드 스트리밍 생성
        logger.info("Generating AI guide (streaming)")
        
        # SSE 형식으로 변환하는 내부 함수 정의
        async def format_as_sse():
            try:
                logger.info("Starting SSE stream for stretching guide")
                async for chunk in HelpyProService.generate_stretching_guide_stream(
                    session_id=session_id,
                    stretching_id=stretching_id,
                    user_input=user_input,
                    relevant_exercises=relevant_exercises,
                    temp_session_service=TempSessionService,
                    user_service=user_service,
                    current_user=current_user
                ):
                    # StreamingAIResponse를 SSE 형식으로 변환
                    data = json.dumps({"content": chunk.content, "done": chunk.done})
                    sse_message = f"data: {data}\n\n"
                    logger.debug(f"Sending SSE chunk: content_length={len(chunk.content)}, done={chunk.done}")
                    logger.debug(f"SSE message format: {sse_message[:50]}...")
                    yield sse_message
                
                logger.info("SSE stream completed successfully")
            except Exception as e:
                logger.error(f"Error in SSE stream: {str(e)}", exc_info=True)
                error_data = json.dumps({"content": "오류가 발생했습니다. 다시 시도해주세요.", "done": True})
                yield f"data: {error_data}\n\n"
        
        # 스트리밍 응답 반환
        logger.info("Returning StreamingResponse with SSE media type")
        return StreamingResponse(
            format_as_sse(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Nginx 버퍼링 비활성화
            }
        )
        
    except Exception as e:
        logger.error(f"Error in create_stretching_session_stream: {str(e)}", exc_info=True)
        raise

@router.post("/sessions/{session_id}/stretching/stream-openai")
async def create_stretching_session_stream_openai(
    session_id: str,
    user_input: UserInput,
    current_user: UserResponse = Depends(get_current_user)
):
    """새로운 스트레칭 세션 생성 및 OpenAI를 사용한 AI 가이드 생성 (스트리밍 방식)"""
    try:
        logger.info(f"Creating OpenAI streaming stretching session for session_id: {session_id}")
        logger.debug(f"User input: {user_input.model_dump()}")
        
        # 0. 임베딩 서비스 초기화 확인
        await EmbeddingService.initialize()
        
        # 1. 임베딩 검색으로 관련 스트레칭 찾기
        logger.info("Searching for relevant stretching exercises")
        body_parts = [part.strip() for part in user_input.selected_body_parts.split(',')]
        relevant_exercises = await EmbeddingService.search(
            query=user_input.pain_description,
            body_parts=body_parts,
            occupation=user_input.occupation,
            top_k=3
        )
        
        logger.info(f"Found {len(relevant_exercises)} relevant exercises")
        
        # 2. 세션에 스트레칭 기록 추가
        logger.info("Adding stretching session to database")
        updated_session = await TempSessionService.add_stretching_session(
            session_id=session_id,
            user_input=user_input
        )
        
        if not updated_session:
            logger.error(f"Session not found: {session_id}")
            raise HTTPException(status_code=404, detail="Session not found")
        
        # 3. 생성된 스트레칭 세션의 ID 찾기
        latest_stretching = updated_session.stretching_sessions[-1]
        stretching_id = latest_stretching.id
        logger.info(f"Created stretching session with ID: {stretching_id}")
        
        # 4. OpenAI를 사용한 AI 가이드 스트리밍 생성
        logger.info("Generating AI guide with OpenAI (streaming)")
        
        # SSE 형식으로 변환하는 내부 함수 정의
        async def format_as_sse():
            try:
                logger.info("Starting OpenAI SSE stream for stretching guide")
                async for chunk in OpenAIStreamingService.generate_stretching_guide_stream(
                    session_id=session_id,
                    stretching_id=stretching_id,
                    user_input=user_input,
                    relevant_exercises=relevant_exercises,
                    temp_session_service=TempSessionService,
                    user_service=user_service,
                    current_user=current_user
                ):
                    # StreamingAIResponse를 SSE 형식으로 변환
                    data = json.dumps({"content": chunk.content, "done": chunk.done})
                    sse_message = f"data: {data}\n\n"
                    logger.debug(f"Sending OpenAI SSE chunk: content_length={len(chunk.content)}, done={chunk.done}")
                    logger.debug(f"SSE message format: {sse_message[:50]}...")
                    yield sse_message
                
                logger.info("OpenAI SSE stream completed successfully")
            except Exception as e:
                logger.error(f"Error in OpenAI SSE stream: {str(e)}", exc_info=True)
                error_data = json.dumps({"content": "OpenAI 스트리밍 중 오류가 발생했습니다. 다시 시도해주세요.", "done": True})
                yield f"data: {error_data}\n\n"
        
        # 스트리밍 응답 반환
        logger.info("Returning OpenAI StreamingResponse with SSE media type")
        return StreamingResponse(
            format_as_sse(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Nginx 버퍼링 비활성화
            }
        )
        
    except Exception as e:
        logger.error(f"Error in create_stretching_session_stream_openai: {str(e)}", exc_info=True)
        raise

@router.get("/muscles")
async def get_all_muscles():
    """모든 근육 목록 조회"""
    try:
        # 임베딩 서비스 초기화 확인
        await EmbeddingService.initialize()
        
        # 메타데이터에서 근육 목록 가져오기
        all_muscles = EmbeddingService._all_muscles
        
        # 근육 데이터 구조화
        result = {
            "total": len(all_muscles),
            "muscles": all_muscles
        }
        
        return result
    except Exception as e:
        logger.error(f"Error in get_all_muscles: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/muscles/{muscle_name}/exercises")
async def get_muscle_exercises(muscle_name: str):
    """특정 근육의 스트레칭 운동 조회"""
    try:
        # 임베딩 서비스 초기화 확인
        await EmbeddingService.initialize()
        
        # 데이터에서 해당 근육 정보 가져오기
        muscles_data = EmbeddingService._data.get("muscles", {})
        
        if muscle_name not in muscles_data:
            raise HTTPException(status_code=404, detail=f"Muscle '{muscle_name}' not found")
        
        muscle_info = muscles_data[muscle_name]
        exercises = muscle_info.get("exercises", [])
        
        # 운동 데이터 전처리
        processed_exercises = []
        for exercise in exercises:
            processed_exercise = {
                "id": exercise.get("id", ""),
                "title": exercise.get("title", ""),
                "한글_제목": f"{muscle_name} 스트레칭",  # 기본 한글 제목 설정
            }
            
            # enhanced_metadata가 있는 경우 처리
            if "enhanced_metadata" in exercise and exercise["enhanced_metadata"]:
                metadata = exercise["enhanced_metadata"]
                
                # 스트레칭 방법 처리
                stretching_method = {}
                if metadata.get("스트레칭_상세화"):
                    stretching_detail = metadata["스트레칭_상세화"]
                    if stretching_detail.get("시작_자세"):
                        # 영어 콘텐츠 필터링
                        start_pose = stretching_detail["시작_자세"]
                        if not is_english_content(start_pose):
                            stretching_method["시작_자세"] = start_pose
                            
                    if stretching_detail.get("동작_단계") and isinstance(stretching_detail["동작_단계"], list) and len(stretching_detail["동작_단계"]) > 0:
                        # 영어 콘텐츠 필터링
                        filtered_steps = [step for step in stretching_detail["동작_단계"] if not is_english_content(step)]
                        if filtered_steps:
                            stretching_method["동작_단계"] = filtered_steps
                            
                    if stretching_detail.get("호흡_방법"):
                        # 영어 콘텐츠 필터링
                        breathing = stretching_detail["호흡_방법"]
                        if not is_english_content(breathing):
                            stretching_method["호흡_방법"] = breathing
                            
                    if stretching_detail.get("목적"):
                        # 영어 콘텐츠 필터링
                        purpose = stretching_detail["목적"]
                        if not is_english_content(purpose):
                            processed_exercise["목적"] = purpose
                
                # 스트레칭 방법이 없고 protocol.steps가 있는 경우
                if not stretching_method.get("동작_단계") and exercise.get("protocol") and exercise["protocol"].get("steps"):
                    # 영어 콘텐츠 필터링
                    steps = exercise["protocol"]["steps"]
                    filtered_steps = [step for step in steps if not is_english_content(step)]
                    
                    if filtered_steps:
                        stretching_method["동작_단계"] = filtered_steps
                
                # 스트레칭 방법이 있는 경우만 추가
                if stretching_method.get("동작_단계"):
                    processed_exercise["스트레칭_방법"] = stretching_method
                
                # 효과 및 적용 처리
                if metadata.get("효과_및_적용"):
                    effects = metadata["효과_및_적용"]
                    processed_effects = {}
                    
                    if effects.get("주요_효과") and isinstance(effects["주요_효과"], list):
                        # 영어 콘텐츠 필터링
                        filtered_effects = [effect for effect in effects["주요_효과"] if not is_english_content(effect)]
                        if filtered_effects:
                            processed_effects["주요_효과"] = filtered_effects
                    
                    if effects.get("적용_대상"):
                        # 영어 콘텐츠 필터링
                        target = effects["적용_대상"]
                        if not is_english_content(target):
                            processed_effects["적용_대상"] = target
                    
                    if processed_effects:
                        processed_exercise["효과_및_적용"] = processed_effects
                
                # 안전 및 주의사항 처리
                if metadata.get("안전_및_주의사항"):
                    safety = metadata["안전_및_주의사항"]
                    processed_safety = {}
                    
                    if safety.get("수행_시_주의점") and isinstance(safety["수행_시_주의점"], list):
                        # 영어 콘텐츠 필터링
                        filtered_cautions = [caution for caution in safety["수행_시_주의점"] if not is_english_content(caution)]
                        if filtered_cautions:
                            processed_safety["수행_시_주의점"] = filtered_cautions
                    
                    if safety.get("금기사항") and isinstance(safety["금기사항"], list):
                        # 영어 콘텐츠 필터링
                        filtered_contraindications = [contraindication for contraindication in safety["금기사항"] if not is_english_content(contraindication)]
                        if filtered_contraindications:
                            processed_safety["금기사항"] = filtered_contraindications
                    
                    if processed_safety:
                        processed_exercise["안전_및_주의사항"] = processed_safety
                
                # 추천 시간 및 빈도 처리
                if metadata.get("실행_가이드라인"):
                    guidelines = metadata["실행_가이드라인"]
                    processed_guidelines = {}
                    
                    if guidelines.get("권장_시간"):
                        # 영어 콘텐츠 필터링
                        time_rec = guidelines["권장_시간"]
                        if not is_english_content(time_rec):
                            processed_guidelines["유지_시간"] = time_rec
                    
                    if guidelines.get("권장_횟수"):
                        # 영어 콘텐츠 필터링
                        rep_rec = guidelines["권장_횟수"]
                        if not is_english_content(rep_rec):
                            processed_guidelines["반복_횟수"] = rep_rec
                    
                    if guidelines.get("권장_빈도"):
                        # 영어 콘텐츠 필터링
                        freq_rec = guidelines["권장_빈도"]
                        if not is_english_content(freq_rec):
                            processed_guidelines["주간_빈도"] = freq_rec
                    
                    if processed_guidelines:
                        processed_exercise["추천_시간_및_빈도"] = processed_guidelines
                
                # 난이도 정보 처리
                if metadata.get("난이도_정보") and metadata["난이도_정보"].get("난이도_수준"):
                    # 영어 콘텐츠 필터링
                    difficulty = metadata["난이도_정보"]["난이도_수준"]
                    if not is_english_content(difficulty):
                        processed_exercise["난이도"] = difficulty
                
                # 태그 처리
                if metadata.get("검색_및_추천용_태그"):
                    tags = metadata["검색_및_추천용_태그"]
                    all_tags = []
                    
                    for tag_category in ["증상_관련_태그", "직업_관련_태그", "상황_관련_태그", "효과_관련_태그"]:
                        if tags.get(tag_category) and isinstance(tags[tag_category], list):
                            # 영어 콘텐츠 필터링
                            filtered_tags = [tag for tag in tags[tag_category] if not is_english_content(tag)]
                            all_tags.extend(filtered_tags)
                    
                    if all_tags:
                        processed_exercise["태그"] = all_tags
            
            # 관련 자료 처리 (중복 제거)
            if exercise.get("evidence"):
                evidence = exercise["evidence"]
                processed_evidence = {}
                
                # 원래 URL이 있으면 항상 포함
                if evidence.get("url"):
                    processed_evidence["url"] = evidence["url"]
                
                # PMID가 있으면 PubMed URL도 생성
                if evidence.get("pmid"):
                    processed_evidence["pubmed_url"] = f"https://pubmed.ncbi.nlm.nih.gov/{evidence['pmid']}/"
                
                if processed_evidence:
                    processed_exercise["관련_자료"] = processed_evidence
            
            # 간략 설명 추가
            if "enhanced_metadata" in exercise and exercise["enhanced_metadata"]:
                metadata = exercise["enhanced_metadata"]
                
                # 목적이 없는 경우 주요 효과에서 설명 생성
                if not processed_exercise.get("목적") and metadata.get("효과_및_적용") and metadata["효과_및_적용"].get("주요_효과"):
                    effects = metadata["효과_및_적용"]["주요_효과"]
                    # 영어 콘텐츠 필터링
                    filtered_effects = [effect for effect in effects if not is_english_content(effect)]
                    if filtered_effects and len(filtered_effects) > 0:
                        processed_exercise["간략_설명"] = f"{muscle_name}의 {', '.join(filtered_effects[:2])}에 효과적인 스트레칭입니다."
            
            # 간략 설명이 없고 abstract가 있는 경우 (최대 100자)
            if not processed_exercise.get("간략_설명") and exercise.get("abstract"):
                abstract = exercise["abstract"]
                # 영어 콘텐츠 필터링 - abstract는 영어일 가능성이 높으므로 사용하지 않음
                if not is_english_content(abstract):
                    if len(abstract) > 100:
                        processed_exercise["간략_설명"] = abstract[:100] + "..."
                    else:
                        processed_exercise["간략_설명"] = abstract
            
            # 간략 설명이 없는 경우 기본 설명 추가
            if not processed_exercise.get("간략_설명"):
                processed_exercise["간략_설명"] = f"{muscle_name}의 유연성을 높이고 통증을 완화하는 스트레칭입니다."
            
            # 스트레칭 방법이 있는 경우만 추가 (필수 조건)
            if "스트레칭_방법" in processed_exercise:
                processed_exercises.append(processed_exercise)
        
        # 결과 구조화
        result = {
            "muscle": muscle_name,
            "english": muscle_info.get("info", {}).get("english", ""),
            "exercises": processed_exercises
        }
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_muscle_exercises: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
