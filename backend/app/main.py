from fastapi import FastAPI
from app.core.config import settings
from app.core.database import MongoManager
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.session import router as session_router
from app.services.temp_session_service import TempSessionService

# 환경 변수 로드
from dotenv import load_dotenv
import os

load_dotenv()  # .env 파일에서 환경 변수 로드

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ✅ API 라우터 포함 확인
app.include_router(
    users_router,
    prefix=settings.API_V1_PREFIX,
    tags=["users"]
)

app.include_router(
    session_router,  # ✅ 추가된 부분
    prefix=settings.API_V1_PREFIX,
    tags=["session"]
)

@app.on_event("startup")
async def startup_event():
    # ✅ 데이터베이스 초기화
    MongoManager.initialize_db()
    # ✅ MongoDB 인덱스 초기화
    await TempSessionService.initialize_indexes()
