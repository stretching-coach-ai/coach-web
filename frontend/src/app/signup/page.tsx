'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { StardustBold } from '../fonts';
import { Stardust } from '../fonts';
import { useRef } from 'react';

const signup = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('회원가입에 실패했습니다!');

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleEmailChange = (e: any) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e: any) => {
    setPassword(e.target.value);
  };

  const errorRef = useRef<HTMLDivElement>(null);
  const toggleVisibillity = (
    ref: React.RefObject<HTMLDivElement | null>,
    isVisible: boolean,
    message?: string
  ) => {
    if (ref.current) {
      ref.current.style.display = isVisible ? 'block' : 'none';
      if (message && isVisible) {
        setErrorMessage(message);
      }
    }
  };

  const handleSignup = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // 폼 제출 방지
    e.preventDefault();
    
    // 입력값 검증
    if (!name || !email || !password) {
      toggleVisibillity(errorRef, true, '모든 필드를 입력해주세요.');
      return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toggleVisibillity(errorRef, true, '유효한 이메일 주소를 입력해주세요.');
      return;
    }
    
    // 비밀번호 길이 검증
    if (password.length < 8) {
      toggleVisibillity(errorRef, true, '비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 프록시 사용: 상대 경로로 API 요청
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      
      console.log('회원가입 요청 데이터:', { name, email, password: '***' });
      console.log('응답 상태:', response.status, response.statusText);
      
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (error) {
        console.error('응답 텍스트 읽기 오류:', error);
      }
      
      let result;
      try {
        // 텍스트가 비어있지 않은 경우에만 JSON 파싱 시도
        result = responseText ? JSON.parse(responseText) : {};
        console.log('파싱된 응답:', result);
      } catch (parseError) {
        console.error('응답 파싱 오류:', parseError);
        console.log('원본 응답 텍스트:', responseText);
        
        if (!response.ok) {
          toggleVisibillity(errorRef, true, `회원가입 실패: 상태 코드 ${response.status} - ${responseText || '응답 없음'}`);
          throw new Error(`회원가입 실패: 상태 코드 ${response.status} - ${responseText || '응답 없음'}`);
        }
      }

      if (!response.ok) {
        console.error('회원가입 실패:', result);
        
        // 오류 메시지 추출 시도
        let errorMessage = '알 수 없는 오류';
        if (result) {
          if (typeof result === 'string') {
            errorMessage = result;
          } else if (result.detail) {
            errorMessage = typeof result.detail === 'object' 
              ? JSON.stringify(result.detail) 
              : result.detail;
          } else if (result.message) {
            errorMessage = result.message;
          } else if (result.error) {
            errorMessage = result.error;
          } else {
            errorMessage = JSON.stringify(result);
          }
        }
        
        // 상태 코드 추가
        errorMessage = `[${response.status}] ${errorMessage}`;
        
        toggleVisibillity(errorRef, true, `회원가입에 실패했습니다: ${errorMessage}`);
        throw new Error(`회원가입 실패: ${errorMessage}`);
      }

      console.log('회원가입 성공:', result);
      
      // 회원가입 후 자동 로그인 처리
      try {
        console.log('자동 로그인 시도 중...');
        
        // 현재 세션 ID 가져오기 (비회원 상태에서 사용 중이던 세션)
        const currentSessionId = localStorage.getItem('sessionId');
        // 이전에 저장된 세션 ID 확인 (ChatInterface에서 저장한 세션)
        const previousSessionId = localStorage.getItem('previousSessionId');
        const sessionIdToMigrate = previousSessionId || currentSessionId;
        
        console.log('현재 세션 ID:', currentSessionId);
        console.log('이전 세션 ID:', previousSessionId);
        console.log('마이그레이션할 세션 ID:', sessionIdToMigrate);
        
        const loginResponse = await fetch(
          '/api/v1/auth/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          },
        );
        
        if (loginResponse.ok) {
          // 로그인 응답에서 데이터와 토큰 추출
          const loginData = await loginResponse.json();
          console.log('자동 로그인 성공:', loginData);
          
          // 사용자 정보 저장
          if (loginData.user) {
            // 기존 사용자 정보 가져오기
            const existingUserInfoStr = localStorage.getItem('userInfo');
            let existingUserInfo: {
              selected_body_parts?: string | null;
              onboardingCompleted?: boolean;
              [key: string]: any;
            } = {};
            
            // 기존 정보가 있으면 파싱
            if (existingUserInfoStr) {
              try {
                existingUserInfo = JSON.parse(existingUserInfoStr);
              } catch (e) {
                console.error('기존 사용자 정보 파싱 오류:', e);
              }
            }
            
            // 선택된 신체 부위 확인 (배열 또는 문자열 모두 처리)
            const hasSelectedBodyParts = existingUserInfo.selected_body_parts && (
              (Array.isArray(existingUserInfo.selected_body_parts) && existingUserInfo.selected_body_parts.length > 0) ||
              (typeof existingUserInfo.selected_body_parts === 'string' && existingUserInfo.selected_body_parts.trim() !== '')
            );
            
            // 온보딩 완료 여부 확인
            const isOnboardingCompleted = hasSelectedBodyParts || existingUserInfo.onboardingCompleted === true;
            
            // 기존 온보딩 상태 유지하면서 새 사용자 정보 병합
            const updatedUserInfo = {
              ...existingUserInfo,
              isLoggedIn: true,
              id: loginData.user.id,
              name: loginData.user.name,
              email: loginData.user.email,
              // 기존 온보딩 상태 유지
              selected_body_parts: existingUserInfo.selected_body_parts || null,
              onboardingCompleted: isOnboardingCompleted
            };
            
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            console.log('사용자 정보 저장 완료 (온보딩 상태 유지):', updatedUserInfo);
          }
          
          // 세션 마이그레이션 처리 (비회원 세션 데이터를 회원 계정으로 연결)
          if (sessionIdToMigrate) {
            await handleSessionMigration(sessionIdToMigrate);
          } else {
            console.log('마이그레이션할 세션 ID가 없음');
            // 세션 ID가 없어도 메인 페이지로 이동
            router.push('/main');
          }
        } else {
          console.log('자동 로그인 실패, 로그인 페이지로 이동');
          router.push('/auth/login');
        }
      } catch (loginError) {
        console.error('자동 로그인 오류:', loginError);
        // 오류가 발생해도 메인 페이지로 이동
        router.push('/main');
      }
    } catch (error) {
      console.error('오류 발생:', error);
      
      // 오류 메시지 추출
      let errorMsg = '회원가입에 실패했습니다';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error && typeof error === 'object') {
        errorMsg = JSON.stringify(error);
      }
      
      toggleVisibillity(errorRef, true, errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 마이그레이션 처리 함수
  const handleSessionMigration = async (sessionId: string) => {
    try {
      console.log('세션 마이그레이션 시도:', sessionId);
      
      // 마이그레이션 API 호출
      const migrateResponse = await fetch('/api/v1/sessions/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 포함 (로그인 후 설정된 인증 쿠키 사용)
        body: JSON.stringify({
          session_id: sessionId
        }),
      });
      
      let responseText = '';
      let migrateData;
      
      try {
        // 응답 텍스트 읽기 시도
        responseText = await migrateResponse.text();
        
        // 응답이 있으면 JSON 파싱 시도
        if (responseText) {
          try {
            migrateData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('마이그레이션 응답 파싱 오류:', parseError);
            console.log('원본 응답 텍스트:', responseText);
          }
        }
      } catch (textError) {
        console.error('응답 텍스트 읽기 오류:', textError);
      }
      
      if (migrateResponse.ok && migrateData) {
        console.log('세션 마이그레이션 성공:', migrateData);
        
        // 세션 ID 정리
        localStorage.removeItem('previousSessionId');
        
        // 마이그레이션 데이터 처리
        if (migrateData.success) {
          console.log(`스트레칭 기록 ${migrateData.stretching_count}개, 대화 기록 ${migrateData.conversation_count}개 마이그레이션 완료`);
          
          // 스트레칭 기록이 있는 경우 알림
          if (migrateData.stretching_count > 0 || migrateData.conversation_count > 0) {
            alert(`이전 활동 내역이 계정으로 성공적으로 이동되었습니다.\n- 스트레칭 기록: ${migrateData.stretching_count}개\n- 대화 기록: ${migrateData.conversation_count}개`);
          }
        }
      } else {
        console.error('세션 마이그레이션 실패:', migrateResponse.status);
        console.error('마이그레이션 오류 상세:', migrateData || responseText);
      }
    } catch (error) {
      console.error('세션 마이그레이션 오류:', error);
    } finally {
      // 마이그레이션 성공 여부와 관계없이 메인 페이지로 이동
      console.log('마이그레이션 처리 완료, 메인 페이지로 이동');
      router.push('/main');
    }
  };

  return (
    <main className="max-w-md flex flex-col items-start m-auto">
      <article className="mx-auto mt-9 flex flex-col justify-center items-center">
        <div
          className="w-full h-full absolute top-0"
          ref={errorRef}
          style={{ display: 'none' }}
          onClick={() => toggleVisibillity(errorRef, false)}
        >
          <div className="absolute top-0 bg-[#0000003b] w-full h-full"></div>
          <div
            className="absolute top-[30%] w-[320px] max-w-[90%] min-h-[185px] bg-[#323232] rounded-[25px] mx-auto my-auto"
            style={{ left: 'calc(50% - 160px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col justify-center items-center p-4">
              <div className="border-b-2 border-b-white mt-[30px] mb-[20px] px-4 text-center w-full">
                <p className="text-[18px] text-white break-words">
                  {errorMessage}
                </p>
              </div>
              <div className="mb-4">
                <button
                  className="bg-white rounded-[6px] w-[174px] h-8 hover:bg-gray-100 transition-colors"
                  onClick={() => toggleVisibillity(errorRef, false)}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className={`${StardustBold.className} text-[#689700] text-[32px]`}>
            회원가입
          </p>
        </div>
        <div className="mt-[60px] text-[24px] w-[332px] h-[58px]">
          <div className="flex">
            <div className="overflow-hidden">
              <div>
                <Image
                  src="/assets/bugi.png"
                  alt="logo"
                  width={35}
                  height={55}
                ></Image>
              </div>
            </div>
            <p
              className={`${Stardust.className} border-b-[2px] border-b-[#93D400]`}
            >
              좋은 선택이다부기!
            </p>
          </div>
        </div>
        <div className="bg-[#F9FFEB] px-3 py-6">
          <Textarea
            className="w-[339px] h-[63px] bg-white rounded-[10px] placeholder-[#9E9797]"
            placeholder="이메일"
            onChange={handleEmailChange}
          ></Textarea>
          <Textarea
            className="w-[339px] h-[63px] bg-white my-7 rounded-[10px] placeholder-[#9E9797]"
            placeholder="비밀번호"
            onChange={handlePasswordChange}
          ></Textarea>
          <Textarea
            className="w-[339px] h-[63px] bg-white rounded-[10px] placeholder-[#9E9797]"
            placeholder="이름"
            onChange={handleNameChange}
          ></Textarea>
        </div>
        <div className="mt-[159px]">
          <Button
            className={`${StardustBold.className} text-[18px]`}
            variant="main"
            size="main"
            onClick={handleSignup}
            disabled={isLoading}
          >
            회원가입하기
          </Button>
        </div>
      </article>
    </main>
  );
};

export default signup;
