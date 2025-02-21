from uuid import uuid4
from fastapi import APIRouter, Response, HTTPException
from backend.app.services.temp_session_service import TempSessionService

router = APIRouter()
temp_session_service = TempSessionService()

@router.post("/start-session/")
async def start_session(response: Response):
    """비회원 세션 생성 API"""
    session_id = str(uuid4())
    response.set_cookie(key="session_id", value=session_id)
    return {"session_id": session_id, "message": "Session started"}

@router.post("/save-temp-data/")
async def save_temp_data(session_id: str, data: dict):
    """비회원 데이터를 저장하는 API"""
    try:
        await temp_session_service.create_temp_session(session_id, data)
        return {"message": "Temporary data saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-temp-data/{session_id}")
async def get_temp_data(session_id: str):
    """비회원 데이터 조회 API"""
    data = await temp_session_service.get_temp_session(session_id)
    if not data:
        raise HTTPException(status_code=404, detail="No data found for this session")
    return {"session_id": session_id, "data": data}
