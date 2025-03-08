# Coach Web - 스트레칭 코치 AI 서비스

코치 웹은 개인 맞춤형 스트레칭 가이드를 제공하는 AI 기반 서비스입니다. 사용자의 상태, 직업, 생활 습관을 고려한 맞춤형 스트레칭 정보를 제공하며, Elice ML API를 활용하여 데이터의 관련성을 검증합니다.

## 프로젝트 구조

```
coach-web/
├── backend/           # FastAPI 기반 백엔드
│   ├── app/
│   │   ├── api/       # API 엔드포인트
│   │   ├── core/      # 핵심 설정
│   │   ├── models/    # 데이터 모델
│   │   ├── schemas/   # 데이터 검증 스키마
│   │   ├── services/  # 비즈니스 로직
│   │   └── main.py    # 앱 진입점
│   ├── data/          # 데이터 저장소
│   ├── scripts/       # 유틸리티 스크립트
│   ├── requirements.txt  # 패키지 의존성
│   └── .env           # 환경 변수
├── frontend/          # Next.js 기반 프론트엔드
│   ├── src/           # 소스 코드
│   │   ├── app/       # 페이지 컴포넌트
│   │   ├── components/# UI 컴포넌트
│   │   └── utils/     # 유틸리티 함수
│   ├── public/        # 정적 파일
│   ├── package.json   # NPM 의존성
│   └── .env.local     # 환경 변수
```

## 사전 요구사항

### 공통
- Git
- Node.js 18 이상
- Python 3.9 이상
- MongoDB

### MongoDB 설치
```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Windows
# MongoDB 웹사이트에서 MongoDB Community Server 다운로드 및 설치
# https://www.mongodb.com/try/download/community

# MongoDB 서비스 시작
# macOS
brew services start mongodb-community

# Windows
# MongoDB는 설치 시 자동으로 서비스로 등록되어 실행됩니다
```

## 설치 및 실행 방법

### 백엔드 설정

1. **저장소 복제**
```bash
git clone https://github.com/stretching-coach-ai/coach-web.git
cd coach-web
```

2. **가상환경 설정**
```bash
# backend 디렉토리로 이동
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **의존성 설치**
```bash
pip install -r requirements.txt
```

4. **환경 변수 설정**
`.env` 파일을 backend 디렉토리에 생성하고 다음 내용을 설정:
```env
HELPY_PRO_API_URL=https://api-cloud-function.elice.io/YOUR_API_ENDPOINT
HELPY_PRO_API_KEY=YOUR_API_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

# 추가 설정 (필요시)
APP_ENV=development
DEBUG=True
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=kkubugi
SESSION_EXPIRY_HOURS=24
SESSION_DEBUG=True
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

5. **백엔드 서버 실행**
```bash
python -m uvicorn app.main:app --reload
```

백엔드 서버가 http://localhost:8000 에서 실행됩니다.

### 프론트엔드 설정

1. **프론트엔드 디렉토리로 이동**
```bash
cd ../frontend
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
`.env.local` 파일을 frontend 디렉토리에 생성:
```
NEXT_PUBLIC_API_BASE_URL=/api
```

4. **개발 서버 실행**
```bash
npm run dev
```

프론트엔드 서버가 http://localhost:3000 에서 실행됩니다.

## API 문서 접근

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 워크플로우 및 Elice ML API 활용

코치 웹의 워크플로우는 다음 4단계로 구성됩니다:

1. **데이터 수집 단계**
   - 의학 데이터베이스(PubMed, KoreaMed, JOSPT)에서 스트레칭 관련 정보 크롤링
   - 수집된 데이터는 근육 카테고리별로 분류 및 저장

2. **데이터 필터링 단계**
   - **Elice ML API 활용**: 수집된 데이터의 스트레칭/통증 관리 관련성 검증
   - 신뢰도(confidence) 0.7 이상 & 관련성이 확인된 항목만 유지
   - 직업별, 신체 부위별 필터링 적용

3. **데이터 강화 단계**
   - BGE 임베딩 모델을 활용한 의미론적 검색 엔진 구현
   - OpenAI GPT-4o Mini 모델을 사용하여 추가 메타데이터 생성 및 정제

4. **사용자 응답 제공 단계**
   - 실시간 AI 응답 생성 및 SSE 기반 스트리밍
   - 사용자 맞춤형 스트레칭 가이드 제공

## 주의사항

- 백엔드 서버와 MongoDB가 먼저 실행된 상태에서 프론트엔드를 실행해야 합니다.
- 환경 변수에 API 키가 올바르게 설정되어 있어야 합니다.
- 백엔드 서버는 반드시 `backend` 디렉토리에서 실행해야 합니다.

## API 엔드포인트

### 세션 관련 API
- POST `/api/v1/sessions/` - 새 세션 생성
- GET `/api/v1/sessions/{session_id}` - 세션 정보 조회
- POST `/api/v1/sessions/{session_id}/stretching` - 스트레칭 세션 추가
- POST `/api/v1/sessions/{session_id}/stretching/{stretching_id}/feedback` - 스트레칭 피드백 추가

### 사용자 관련 API
- POST `/api/v1/users/` - 회원가입
- GET `/api/v1/users/{user_id}` - 회원 정보 조회
- PATCH `/api/v1/users/{user_id}` - 회원 정보 수정
- GET `/api/v1/users/{user_id}/stretching-history` - 스트레칭 히스토리 조회

### 꾸부기 챗 API
- POST `/api/v1/kkubugi/chat` - 스트레칭 정보 요청




