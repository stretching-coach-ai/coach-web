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
    allow_origins=["*"],  # 실제 운영환경에서는 구체적인 origin을 지정해야 함
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
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["auth"]
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the application...")
    # ✅ 데이터베이스 초기화
    MongoManager.initialize_db()
    # ✅ MongoDB 인덱스 초기화
    await TempSessionService.initialize_indexes()
    await AuthService().initialize_indexes()
    
    # ✅ 임베딩 서비스 초기화
    logger.info("Initializing embedding service...")
    try:
        await EmbeddingService.initialize()
        logger.info("Embedding service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize embedding service: {str(e)}", exc_info=True)
        logger.warning("Application will continue, but embedding-based search may not work properly")
    
    logger.info("Application startup complete")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        workers=4,  # CPU 코어 수에 따라 조정
        limit_concurrency=100,  # 동시 연결 제한
        backlog=2048,  # 연결 대기열 크기
        timeout_keep_alive=5,  # Keep-alive 타임아웃
        log_level="info"
    )


