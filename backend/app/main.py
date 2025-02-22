from fastapi import FastAPI
import logging
from app.core.config import settings
from app.core.database import MongoManager
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.session import router as session_router
from app.services.temp_session_service import TempSessionService

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

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up the application...")
    # ✅ 데이터베이스 초기화
    MongoManager.initialize_db()
    # ✅ MongoDB 인덱스 초기화
    await TempSessionService.initialize_indexes()
    logger.info("Application startup complete")
