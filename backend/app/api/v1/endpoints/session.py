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
        return StreamingResponse(
            HelpyProService.generate_stretching_guide_stream(
                session_id=session_id,
                stretching_id=stretching_id,
                user_input=user_input,
                relevant_exercises=relevant_exercises,
                temp_session_service=TempSessionService,
                user_service=user_service,
                current_user=current_user
            ),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"Error in create_stretching_session_stream: {str(e)}", exc_info=True)
        raise
