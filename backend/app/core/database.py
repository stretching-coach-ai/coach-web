from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class MongoManager:
    """MongoDB 연결을 관리하는 클래스"""
    client = None
    db = None

    @classmethod
    async def connect(cls):
        """MongoDB 클라이언트 연결"""
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}")
        try:
            cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            
            # 연결 테스트
            await cls.client.admin.command('ping')
            logger.info("MongoDB connection successful")
            return True
        except Exception as e:
            logger.error(f"MongoDB connection failed: {str(e)}")
            raise

    @classmethod
    async def initialize(cls):
        """MongoDB 클라이언트 초기화 (이전 버전과의 호환성 유지)"""
        return await cls.connect()

    @classmethod
    async def close(cls):
        """MongoDB 클라이언트 연결 종료"""
        if cls.client:
            logger.info("Closing MongoDB connection")
            cls.client.close()
            cls.client = None
            cls.db = None
            return True
        return False

    @classmethod
    def get_db(cls):
        """MongoDB 데이터베이스 반환"""
        if cls.db is None:
            logger.warning("MongoDB connection not initialized. Using default connection.")
            cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
            cls.db = cls.client[settings.MONGODB_DB_NAME]
        return cls.db

    @classmethod
    def get_collection(cls, collection_name: str):
        """MongoDB 컬렉션 반환"""
        if cls.db is None:
            logger.warning("MongoDB connection not initialized. Using default connection.")
            cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
            cls.db = cls.client[settings.MONGODB_DB_NAME]
        return cls.db[collection_name]

    @classmethod
    def initialize_db(cls):
        """필요한 경우 DB 초기화"""
        if settings.MONGODB_INIT_MODE == "create":
            pass  # 여기에 초기화 로직 추가 가능
