from uuid import uuid4
import logging
from fastapi import APIRouter, Response, HTTPException
from app.services.temp_session_service import TempSessionService
from app.services.helpy_pro_service import HelpyProService
from app.schemas.user_input import UserInput
from app.schemas.ai_response import AIResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/sessions/")
async def create_session(response: Response):
    """새로운 세션 생성"""
    session_id = str(uuid4())
    await TempSessionService.create_session(session_id)
    response.set_cookie(key="session_id", value=session_id)
    return {"session_id": session_id, "message": "Session created successfully"}

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
    user_input: UserInput
):
    """새로운 스트레칭 세션 생성 및 AI 가이드 생성"""
    try:
        logger.info(f"Creating stretching session for session_id: {session_id}")
        logger.debug(f"User input: {user_input.dict()}")
        
        # 1. AI 가이드 생성
        ai_response = await HelpyProService.generate_stretching_guide(
            session_id=session_id,
            user_input=user_input
        )
        
        logger.info("AI guide generated successfully")
        
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
        logger.info(f"Created stretching session with ID: {latest_stretching.id}")
        
        # 4. AI 응답 저장
        logger.info("Updating stretching AI response")
        await TempSessionService.update_stretching_ai_response(
            session_id=session_id,
            stretching_id=latest_stretching.id,
            ai_response=ai_response.text
        )
        
        return ai_response
        
    except Exception as e:
        logger.error(f"Error in create_stretching_session: {str(e)}", exc_info=True)
        raise
