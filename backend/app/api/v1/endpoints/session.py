from uuid import uuid4
import logging
from fastapi import APIRouter, Response, HTTPException, Cookie, Depends
from fastapi.responses import StreamingResponse
from app.services.temp_session_service import TempSessionService
from app.services.helpy_pro_service import HelpyProService
from app.services.user_service import UserService
from app.schemas.user_input import UserInput
from app.schemas.ai_response import AIResponse, StreamingAIResponse
from app.schemas.session import StretchingSession
from app.schemas.user import UserResponse
from app.services.embedding_service import EmbeddingService
from app.api.v1.dependencies import get_current_user
import json

logger = logging.getLogger(__name__)

router = APIRouter()
user_service = UserService()

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

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """세션 정보 조회"""
    session = await TempSessionService.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
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
        logger.debug(f"User input: {user_input.dict()}")
        
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
        logger.debug(f"User input: {user_input.dict()}")
        
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
                    yield f"data: {data}\n\n"
                    logger.debug(f"Sent SSE chunk: {data[:50]}...")
            except Exception as e:
                logger.error(f"Error in SSE stream: {str(e)}", exc_info=True)
                error_data = json.dumps({"content": "오류가 발생했습니다. 다시 시도해주세요.", "done": True})
                yield f"data: {error_data}\n\n"
        
        return StreamingResponse(
            format_as_sse(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"Error in create_stretching_session_stream: {str(e)}", exc_info=True)
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
                        stretching_method["시작_자세"] = stretching_detail["시작_자세"]
                    if stretching_detail.get("동작_단계") and isinstance(stretching_detail["동작_단계"], list) and len(stretching_detail["동작_단계"]) > 0:
                        stretching_method["동작_단계"] = stretching_detail["동작_단계"]
                    if stretching_detail.get("호흡_방법"):
                        stretching_method["호흡_방법"] = stretching_detail["호흡_방법"]
                    if stretching_detail.get("목적"):
                        processed_exercise["목적"] = stretching_detail["목적"]
                
                # 스트레칭 방법이 없고 protocol.steps가 있는 경우
                if not stretching_method.get("동작_단계") and exercise.get("protocol") and exercise["protocol"].get("steps"):
                    # 영어 콘텐츠 필터링 - 영어가 포함된 경우 건너뜁니다
                    steps = exercise["protocol"]["steps"]
                    contains_english = False
                    for step in steps:
                        # 영어 문자가 포함되어 있는지 확인 (A-Za-z)
                        if any(ord(c) >= 65 and ord(c) <= 122 for c in step):
                            contains_english = True
                            break
                    
                    if not contains_english:
                        stretching_method["동작_단계"] = steps
                
                # 스트레칭 방법이 있는 경우만 추가
                if stretching_method.get("동작_단계"):
                    # 영어 콘텐츠 필터링 - 동작 단계에 영어가 포함된 경우 건너뜁니다
                    contains_english = False
                    for step in stretching_method["동작_단계"]:
                        if any(ord(c) >= 65 and ord(c) <= 122 for c in step):
                            contains_english = True
                            break
                    
                    if not contains_english:
                        processed_exercise["스트레칭_방법"] = stretching_method
                
                # 효과 및 적용 처리
                if metadata.get("효과_및_적용"):
                    effects = metadata["효과_및_적용"]
                    processed_effects = {}
                    
                    if effects.get("주요_효과") and isinstance(effects["주요_효과"], list):
                        processed_effects["주요_효과"] = effects["주요_효과"]
                    
                    if effects.get("적용_대상"):
                        processed_effects["적용_대상"] = effects["적용_대상"]
                    
                    if processed_effects:
                        processed_exercise["효과_및_적용"] = processed_effects
                
                # 안전 및 주의사항 처리
                if metadata.get("안전_및_주의사항"):
                    safety = metadata["안전_및_주의사항"]
                    processed_safety = {}
                    
                    if safety.get("수행_시_주의점") and isinstance(safety["수행_시_주의점"], list):
                        processed_safety["수행_시_주의점"] = safety["수행_시_주의점"]
                    
                    if safety.get("금기사항") and isinstance(safety["금기사항"], list):
                        processed_safety["금기사항"] = safety["금기사항"]
                    
                    if processed_safety:
                        processed_exercise["안전_및_주의사항"] = processed_safety
                
                # 추천 시간 및 빈도 처리
                if metadata.get("실행_가이드라인"):
                    guidelines = metadata["실행_가이드라인"]
                    processed_guidelines = {}
                    
                    if guidelines.get("권장_시간"):
                        processed_guidelines["유지_시간"] = guidelines["권장_시간"]
                    
                    if guidelines.get("권장_횟수"):
                        processed_guidelines["반복_횟수"] = guidelines["권장_횟수"]
                    
                    if guidelines.get("권장_빈도"):
                        processed_guidelines["주간_빈도"] = guidelines["권장_빈도"]
                    
                    if processed_guidelines:
                        processed_exercise["추천_시간_및_빈도"] = processed_guidelines
                
                # 난이도 정보 처리
                if metadata.get("난이도_정보") and metadata["난이도_정보"].get("난이도_수준"):
                    processed_exercise["난이도"] = metadata["난이도_정보"]["난이도_수준"]
                
                # 태그 처리
                if metadata.get("검색_및_추천용_태그"):
                    tags = metadata["검색_및_추천용_태그"]
                    all_tags = []
                    
                    for tag_category in ["증상_관련_태그", "직업_관련_태그", "상황_관련_태그", "효과_관련_태그"]:
                        if tags.get(tag_category) and isinstance(tags[tag_category], list):
                            all_tags.extend(tags[tag_category])
                    
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
                    if effects and len(effects) > 0:
                        processed_exercise["간략_설명"] = f"{muscle_name}의 {', '.join(effects[:2])}에 효과적인 스트레칭입니다."
            
            # 간략 설명이 없고 abstract가 있는 경우 (최대 100자)
            if not processed_exercise.get("간략_설명") and exercise.get("abstract"):
                abstract = exercise["abstract"]
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
