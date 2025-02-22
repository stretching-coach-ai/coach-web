# Stretching Coach AI

AI 기반 맞춤형 스트레칭 가이드 서비스

## 개발 환경 설정

### 1. Python 가상환경 설정

```bash
# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 의존성 설치
pip install -r backend/requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일을 backend 디렉토리에 생성하고 다음 내용을 추가:

```env
APP_ENV=development
DEBUG=True
API_V1_PREFIX=/api/v1

HOST=127.0.0.1
PORT=8000

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=stretch_ai_db

# Helpy Pro API Configuration
HELPY_PRO_API_URL=your_api_url
HELPY_PRO_API_KEY=your_api_key

# Session Configuration
SESSION_EXPIRY_HOURS=24
```

### 3. 서버 실행

```bash
# 개발 서버 실행
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

## API 문서

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
