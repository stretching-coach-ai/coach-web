from fastapi import FastAPI
import logging
from app.core.config import settings
from app.core.database import MongoManager
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.session import router as session_router
from app.api.v1.endpoints.auth import router as auth_router
from app.services.temp_session_service import TempSessionService
from app.services.auth_service import AuthService
from app.services.embedding_service import EmbeddingService
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# 환경 변수 로드
from dotenv import load_dotenv
import os

# 로깅 설정
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # 콘솔 출력
        logging.FileHandler('app.log')  # 파일 출력
    ]
)

logger = logging.getLogger(__name__)

load_dotenv()  # .env 파일에서 환경 변수 로드

# 환경 변수 로드 확인
logger.info("🔍 Loaded Environment Variables:")
logger.info(f" - APP_ENV: {settings.APP_ENV}")
logger.info(f" - DEBUG: {settings.DEBUG}")
logger.info(f" - MONGODB_URL: {settings.MONGODB_URL}")
logger.info(f" - MONGODB_DB_NAME: {settings.MONGODB_DB_NAME}")
logger.info(f" - HELPY_PRO_API_URL: {settings.HELPY_PRO_API_URL}")
logger.info(f" - SESSION_EXPIRY_HOURS: {settings.SESSION_EXPIRY_HOURS}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ API 라우터 포함
app.include_router(
    users_router,
    prefix=settings.API_V1_PREFIX,
    tags=["users"]
)

app.include_router(
    session_router,
    prefix=settings.API_V1_PREFIX,
    tags=["session"]
)

app.include_router(
    auth_router,
    prefix=settings.API_V1_PREFIX,
    tags=["auth"]
)

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행되는 이벤트 핸들러"""
    logger.info("🚀 Starting application...")
    
    # MongoDB 연결
    logger.info("📊 Connecting to MongoDB...")
    await MongoManager.connect()
    logger.info("✅ MongoDB connected successfully")
    
    # 인덱스 초기화
    logger.info("🔍 Initializing indexes...")
    await TempSessionService.initialize_indexes()
    await AuthService().initialize_indexes()
    logger.info("✅ Indexes initialized successfully")
    
    # 임베딩 서비스 초기화
    logger.info("🧠 Initializing embedding service...")
    await EmbeddingService.initialize()
    logger.info("✅ Embedding service initialized successfully")
    
    logger.info("✨ Application startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 실행되는 이벤트 핸들러"""
    logger.info("🛑 Shutting down application...")
    
    # MongoDB 연결 종료
    logger.info("📊 Closing MongoDB connection...")
    await MongoManager.close()
    logger.info("✅ MongoDB connection closed successfully")
    
    logger.info("👋 Application shutdown complete")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


