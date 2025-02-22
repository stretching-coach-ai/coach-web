from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoManager:
    """MongoDB 연결을 관리하는 클래스"""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]

    @classmethod
    def get_db(cls):
        """MongoDB 데이터베이스 반환"""
        return cls.db

    @classmethod
    def get_collection(cls, collection_name: str):
        """MongoDB 컬렉션 반환"""
        return cls.db[collection_name]

    @classmethod
    def initialize_db(cls):
        """필요한 경우 DB 초기화"""
        if settings.MONGODB_INIT_MODE == "create":
            pass  # 여기에 초기화 로직 추가 가능
