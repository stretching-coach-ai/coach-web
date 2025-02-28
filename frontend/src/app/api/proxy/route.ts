import { NextRequest, NextResponse } from 'next/server';

// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * 백엔드 API로 요청을 프록시하는 함수
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { endpoint, method = 'GET', data = null } = body;
    
    if (!endpoint) {
      return NextResponse.json(
        { error: '엔드포인트가 지정되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 쿠키 가져오기
    const cookies = request.cookies;
    const sessionIdCookie = cookies.get('session_id');
    
    // 요청 옵션 구성
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionIdCookie ? { Cookie: `session_id=${sessionIdCookie.value}` } : {})
      },
      credentials: 'include',
    };

    // POST, PUT 요청인 경우 본문 추가
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    console.log(`프록시 요청: ${API_BASE_URL}${endpoint}`, options);
    
    // 백엔드 API 호출
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const responseData = await response.json();

    // 응답 반환
    return NextResponse.json(responseData, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('프록시 API 오류:', error);
    return NextResponse.json(
      { error: '프록시 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * CORS 프리플라이트 요청 처리
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 