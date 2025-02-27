from functools import lru_cache
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
import os

# ✅ .env 파일을 명확하게 로드
load_dotenv()

class Settings(BaseSettings):
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True") == "True"
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Stretching Coach AI")

    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key")

    # MongoDB Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "stretch_ai_db")
    MONGODB_INIT_MODE: str = os.getenv("MONGODB_INIT_MODE", "none")

    # Helpy Pro API Configuration
    HELPY_PRO_API_URL: str = os.getenv("HELPY_PRO_API_URL", "https://api-cloud-function.elice.io/9f071d94-a459-429d-a375-9601e521b079")
    HELPY_PRO_API_KEY: str = os.getenv("HELPY_PRO_API_KEY", "")
    
    # OpenAI API Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Session Configuration
    SESSION_EXPIRY_HOURS: int = int(os.getenv("SESSION_EXPIRY_HOURS", "24"))
    
    class Config:
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

# ✅ 환경 변수 정상 로드 확인 로그 출력
print("🔍 Loaded Environment Variables:")
print(f" - APP_ENV: {settings.APP_ENV}")
print(f" - DEBUG: {settings.DEBUG}")
print(f" - MONGODB_URL: {settings.MONGODB_URL}")
print(f" - MONGODB_DB_NAME: {settings.MONGODB_DB_NAME}")
print(f" - HELPY_PRO_API_URL: {settings.HELPY_PRO_API_URL}")
print(f" - OPENAI_API_KEY: {'설정됨' if settings.OPENAI_API_KEY else '설정되지 않음'}")
print(f" - SESSION_EXPIRY_HOURS: {settings.SESSION_EXPIRY_HOURS}")
