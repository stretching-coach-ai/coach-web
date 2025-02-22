# Stretching Coach AI Backend

## 프로젝트 구조
```
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── requirements.txt
└── .env
```

## 설치 및 실행 방법

### 1. 환경 설정
```bash
# backend 디렉토리로 이동
cd backend

# 가상환경 생성
python -m venv venv

# 가상환경 활성화
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 의존성 설치
```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정
`.env` 파일을 backend 디렉토리에 생성하고 다음 내용을 설정:
```env
APP_ENV=development
DEBUG=True
API_V1_PREFIX=/api/v1
PROJECT_NAME=Stretching Coach AI
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=stretch_ai_db
HELPY_PRO_API_KEY=your-api-key
```

### 4. 서버 실행
```bash
python -m uvicorn app.main:app --reload
```

### 5. API 문서
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 주의사항
- 서버 실행은 반드시 `backend` 디렉토리에서 해야 합니다.
- 모든 Python import는 `app` 패키지를 기준으로 합니다.

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

## 개발 예정 기능
1. 인증/인가 시스템
   - JWT 토큰 기반 인증
   - 로그인/로그아웃
   - 비밀번호 암호화

2. 사용자 프로필 관리
   - 프로필 수정
   - 비밀번호 변경
   - 회원 탈퇴

3. 스트레칭 히스토리 관리
   - 히스토리 필터링
   - 통계 데이터
   - 진행 상황 추적

4. 보안 강화
   - API 요청 제한
   - CORS 설정
   - 입력 데이터 검증

## 기여 방법
1. 이 저장소를 포크합니다.
2. 새로운 브랜치를 생성합니다.
3. 변경사항을 커밋합니다.
4. 브랜치에 푸시합니다.
5. Pull Request를 생성합니다.
