from motor.motor_asyncio import AsyncIOMotorClient
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoManager:
    """MongoDB 연결 관리 클래스"""
    client: AsyncIOMotorClient = None
    db = None
    
    @classmethod
    async def connect_to_mongo(cls):
        """MongoDB 연결 설정"""
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}")
            cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            logger.info(f"Connected to MongoDB database: {settings.MONGODB_DB_NAME}")
            
            # 연결 테스트
            await cls.db.command("ping")
            logger.info("MongoDB connection test successful")
            
            return cls.client
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    @classmethod
    async def close_mongo_connection(cls):
        """MongoDB 연결 종료"""
        if cls.client:
            logger.info("Closing MongoDB connection")
            cls.client.close()
            cls.client = None
            cls.db = None
    
    @classmethod
    def get_db(cls):
        """데이터베이스 객체 반환"""
        if not cls.db:
            logger.warning("MongoDB connection not initialized, attempting to connect")
            cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
            cls.db = cls.client[settings.MONGODB_DB_NAME]
        return cls.db
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """컬렉션 객체 반환"""
        db = cls.get_db()
        return db[collection_name]

    @classmethod
    def initialize_db(cls):
        """필요한 경우 DB 초기화"""
        if settings.MONGODB_INIT_MODE == "create":
            pass  # 여기에 초기화 로직 추가 가능
