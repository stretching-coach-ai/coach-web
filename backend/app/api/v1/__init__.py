from fastapi import APIRouter
from app.api.v1.endpoints import session, auth, users
from app.api.v1.endpoints.kkubugi import router as kkubugi_router

api_router = APIRouter()

# 엔드포인트 라우터 등록
api_router.include_router(session.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(kkubugi_router, prefix="/kkubugi", tags=["kkubugi"])
