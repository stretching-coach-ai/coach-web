import time
import logging
from typing import Optional, Dict, Any, AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.status import HTTP_400_BAD_REQUEST
from pydantic import BaseModel

import openai
from openai import AsyncOpenAI
import os

router = APIRouter()
logger = logging.getLogger(__name__)

# OpenAI 클라이언트 설정
openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# 꾸부기 시스템 프롬프트
KKUBUGI_PROMPT = """
당신은 '꾸부기'라는 캐릭터입니다. 당신은 스트레칭 코치 서비스의 마스코트입니다.

# 서비스 소개
- 우리의 서비스는 사용자들에게 맞춤형 스트레칭 가이드를 제공합니다.
- 주로, 직장인들의 자세 교정, 근육통 완화, 스트레스 해소를 목표로 합니다.
- 사용자의 신체 상태, 통증 부위, 일상 습관에 맞춘 맞춤형 스트레칭을 추천합니다.

# 꾸부기의 페르소나
- 꾸부기는 거북이 캐릭터로, 건강하고 유연한 몸을 상징합니다.
- 항상 긍정적이고 친절하며, 귀여운 말투를 사용합니다.
- 건강과 스트레칭에 관한 지식이 풍부합니다.
- 사용자를 응원하고 동기부여하는 역할을 합니다.
- 가장 중요한 특징: 모든 문장의 끝에 "부기"를 붙여서 말합니다.

# 말투 예시
- "안녕하세요부기! 오늘 어떻게 도와드릴까요부기?"
- "목 스트레칭을 추천해 드릴게요부기!"
- "하루에 5분만 투자해도 큰 변화가 있을 거예요부기!"

모든 응답에서 반드시 문장 끝에 "부기"를 붙이세요. 이것은 꾸부기의 가장 핵심적인 특징입니다.
스트레칭, 건강 관리, 자세 교정에 관한 실용적인 조언을 제공하되, 항상 친근하고 귀여운 톤을 유지하세요.
"""


class KkubugiMessage(BaseModel):
    """꾸부기 메시지 요청 스키마"""
    message: str


async def stream_openai_response(message: str) -> AsyncGenerator[bytes, None]:
    """
    OpenAI API로부터 스트리밍 응답을 받아 클라이언트에게 전달하는 제너레이터 함수
    """
    try:
        # OpenAI 스트리밍 응답 시작
        start_time = time.time()
        logger.info(f"꾸부기 API 요청: {message[:50]}...")

        # GPT-3.5 Turbo로 스트리밍 응답 생성
        stream = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",  # 비용 효율적인 모델 사용
            messages=[
                {"role": "system", "content": KKUBUGI_PROMPT},
                {"role": "user", "content": message}
            ],
            stream=True,
            max_tokens=800,  # 토큰 제한으로 비용 관리
            temperature=0.7,  # 적절한 창의성과 일관성 밸런스
        )

        # 스트리밍 응답 처리
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                # 스트리밍 포맷으로 변환하여 전송
                yield f"data: {content}\n\n".encode('utf-8')

        # 종료 신호 전송
        yield b"data: [DONE]\n\n"
        
        # 응답 완료 로깅
        duration = time.time() - start_time
        logger.info(f"꾸부기 응답 완료: 소요시간 {duration:.2f}초")
        
    except Exception as e:
        # 오류 로깅
        logger.error(f"꾸부기 API 오류: {str(e)}")
        # 오류 메시지 전송
        error_msg = "죄송합니다, 응답 처리 중 오류가 발생했습니다부기!"
        yield f"data: {error_msg}\n\n".encode('utf-8')
        yield b"data: [DONE]\n\n"


@router.post("/chat")
async def kkubugi_chat(
    message_data: KkubugiMessage,
    request: Request,
) -> StreamingResponse:
    """
    꾸부기 캐릭터와 채팅하는 스트리밍 API
    """
    # 메시지 유효성 검사
    if not message_data.message or len(message_data.message.strip()) == 0:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="메시지 내용이 필요합니다부기!"
        )

    # 스트리밍 응답 반환
    return StreamingResponse(
        stream_openai_response(message_data.message.strip()),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    ) 