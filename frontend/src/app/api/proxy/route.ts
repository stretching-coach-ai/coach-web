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
    
    console.log('프록시 API 쿠키:', cookies.getAll());
    console.log('세션 ID 쿠키:', sessionIdCookie);
    
    // 요청 옵션 구성
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionIdCookie ? `session_id=${sessionIdCookie.value}` : ''
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
    
    // 응답 상태 로깅
    console.log('백엔드 응답 상태:', response.status, response.statusText);
    
    // 응답 헤더 확인
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log('백엔드 응답 헤더:', responseHeaders);
    
    // 쿠키 추출
    const setCookieHeader = response.headers.get('set-cookie');
    console.log('SET-COOKIE 헤더:', setCookieHeader);
    
    // 응답 본문 준비
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      console.error('응답 파싱 오류:', error);
      responseData = { error: '응답 파싱 오류' };
    }
    
    // 스트레칭 API 응답인 경우 로깅
    if (endpoint.includes('/stretching')) {
      console.log('스트레칭 API 응답 데이터:', JSON.stringify(responseData, null, 2));
    }
    
    // 응답 생성
    const nextResponse = NextResponse.json(responseData);
    
    // 백엔드에서 설정한 쿠키를 클라이언트에 전달
    if (setCookieHeader) {
      // 쿠키 헤더 파싱
      const sessionIdMatch = setCookieHeader.match(/session_id=([^;]+)/);
      if (sessionIdMatch && sessionIdMatch[1]) {
        console.log('세션 ID 쿠키 전달:', sessionIdMatch[1]);
        
        // 클라이언트에 쿠키 설정
        nextResponse.cookies.set({
          name: 'session_id',
          value: sessionIdMatch[1],
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 3600 * 24 * 7
        });
      }
    }
    
    return nextResponse;
    
  } catch (error) {
    console.error('프록시 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류', details: error instanceof Error ? error.message : String(error) },
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