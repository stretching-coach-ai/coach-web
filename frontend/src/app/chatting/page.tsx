'use client';

import { useState, useEffect, useRef } from 'react';
import { Gnb } from '@/components/Gnb';
import { Fnb } from '@/components/Fnb';
import { ChatInterface } from '@/components/ChatInterface';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useMutation } from '@tanstack/react-query';
import { Message } from '@/types/chat';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// fetchWithTimeout 함수 정의 - 지정된 시간 이후 타임아웃되는 fetch 함수
const fetchWithTimeout = (url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> => {
  const { timeout = 8000, ...fetchOptions } = options;
  
  return new Promise((resolve, reject) => {
    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('요청 시간이 초과되었습니다.'));
    }, timeout);
    
    // 실제 fetch 요청
    fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export default function ChatUI() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [messageCount, setMessageCount] = useState(0);
  const router = useRouter();

  // 사용자 로그인 상태 확인 함수
  const checkUserLoggedIn = async (): Promise<boolean> => {
    try {
      // 로컬 스토리지에서 사용자 정보 확인
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        console.log('사용자 정보 확인:', userInfo);
        // 사용자 정보가 있고 isLoggedIn이 true인 경우에만 로그인 상태로 간주
        if (userInfo.isLoggedIn === true) {
          return true;
        }
      }
      
      // API를 통한 세션 확인 (더 정확한 방법)
      try {
        const response = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('API에서 사용자 인증 상태 확인:', data);
          return data.is_authenticated === true;
        }
      } catch (apiError) {
        console.error('API 인증 확인 오류:', apiError);
      }
      
      // 로컬 스토리지에 사용자 정보가 없거나 API 확인이 실패하면 비로그인 상태
      console.log('사용자 정보 없음 또는 API 확인 실패, 비로그인 상태');
      return false;
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      return false;
    }
  };

  // 온보딩 완료 여부 확인 함수 추가
  const checkOnboardingCompleted = (): boolean => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        
        // 선택된 신체 부위 확인 (배열 또는 문자열 모두 처리)
        const hasSelectedBodyParts = userInfo.selected_body_parts && (
          (Array.isArray(userInfo.selected_body_parts) && userInfo.selected_body_parts.length > 0) ||
          (typeof userInfo.selected_body_parts === 'string' && userInfo.selected_body_parts.trim() !== '')
        );
        
        // 온보딩 완료 플래그 확인
        const isCompleted = userInfo.onboardingCompleted === true;
        
        // 둘 중 하나라도 true면 온보딩 완료로 간주
        return hasSelectedBodyParts || isCompleted;
      }
      return false;
    } catch (error) {
      console.error('온보딩 상태 확인 오류:', error);
      return false;
    }
  };

  // 고유한 ID를 가진 초기 메시지 설정 - 고정된 ID 사용
  const initialMessages: Message[] = [
    { id: 1, text: '어떻게 아프냐부기?', sender: 'bot' },
  ];

  // 세션 정보 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsInitializing(true);
        
        // 먼저 로컬 스토리지에서 세션 ID 확인
        const localSessionId = localStorage.getItem('sessionId');
        console.log('로컬 스토리지 세션 ID:', localSessionId);
        
        // 쿠키 기반 세션 ID 확인 (이미 존재하는 세션 확인)
        try {
          const sessionResponse = await fetch('/api/v1/sessions/current', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          // 세션이 있는 경우 (쿠키에 유효한 세션 ID가 있음)
          if (sessionResponse.ok) {
            const data = await sessionResponse.json();
            
            if (data && data.session_id) {
              console.log('API에서 받은 세션 ID:', data.session_id);
              setSessionId(data.session_id);
              
              // 로컬 스토리지에 세션 ID 저장 (백업)
              localStorage.setItem('sessionId', data.session_id);
              
              // 이전 세션 ID가 있고 현재 세션 ID와 다른 경우, 이전 세션 ID로 저장
              if (localSessionId && localSessionId !== data.session_id) {
                console.log('이전 세션 ID 저장:', localSessionId);
                localStorage.setItem('previousSessionId', localSessionId);
              }
              
              // 로그인 상태 확인
              const loggedIn = await checkUserLoggedIn();
              setIsLoggedIn(loggedIn);
            }
          } else {
            // API가 실패했지만 로컬 스토리지에 세션 ID가 있는 경우
            if (localSessionId) {
              console.log('API 오류, 로컬 스토리지의 세션 ID 사용:', localSessionId);
              setSessionId(localSessionId);
            } else {
              // 온보딩 완료 여부 확인
              const onboardingCompleted = checkOnboardingCompleted();
              
              if (!onboardingCompleted) {
                console.log('온보딩이 완료되지 않았습니다. 온보딩 페이지로 이동합니다.');
                router.push('/onboarding');
                return;
              }
              
              // 세션 ID가 없는 경우, 새 세션 생성
              console.log('세션 ID가 없어 새 세션 생성 시도');
              try {
                // 로컬 스토리지에서 선택된 신체 부위 정보 가져오기
                let selectedBodyParts = null;
                try {
                  const userInfoStr = localStorage.getItem('userInfo');
                  if (userInfoStr) {
                    const userInfo = JSON.parse(userInfoStr);
                    selectedBodyParts = userInfo.selected_body_parts;
                  }
                } catch (error) {
                  console.error('사용자 정보 파싱 오류:', error);
                }
                
                // 세션 생성 요청
                const createResponse = await fetch('/api/v1/sessions', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    body_parts: selectedBodyParts
                  })
                });
                
                if (createResponse.ok) {
                  const createData = await createResponse.json();
                  console.log('새 세션 생성 성공:', createData);
                  setSessionId(createData.session_id);
                  localStorage.setItem('sessionId', createData.session_id);
                } else {
                  console.error('새 세션 생성 실패:', createResponse.status);
                  
                  // 세션 생성 실패 시 온보딩 페이지로 이동
                  console.log('세션 생성 실패, 온보딩 페이지로 이동합니다.');
                  router.push('/onboarding');
                  return;
                }
              } catch (createError) {
                console.error('세션 생성 오류:', createError);
                
                // 오류 발생 시 온보딩 페이지로 이동
                console.log('세션 생성 중 오류 발생, 온보딩 페이지로 이동합니다.');
                router.push('/onboarding');
                return;
              }
            }
            
            // 로그인 상태 확인
            const loggedIn = await checkUserLoggedIn();
            setIsLoggedIn(loggedIn);
          }
        } catch (apiError) {
          console.error('세션 API 호출 오류:', apiError);
          
          // API 오류 발생 시 로컬 스토리지의 세션 ID 사용
          if (localSessionId) {
            console.log('API 오류, 로컬 스토리지의 세션 ID 사용:', localSessionId);
            setSessionId(localSessionId);
          } else {
            // 온보딩 완료 여부 확인
            const onboardingCompleted = checkOnboardingCompleted();
            
            if (!onboardingCompleted) {
              console.log('온보딩이 완료되지 않았습니다. 온보딩 페이지로 이동합니다.');
              router.push('/onboarding');
              return;
            }
            
            // 세션 ID가 없는 경우, 새 세션 생성
            console.log('세션 ID가 없어 새 세션 생성 시도');
            try {
              // 로컬 스토리지에서 선택된 신체 부위 정보 가져오기
              let selectedBodyParts = null;
              try {
                const userInfoStr = localStorage.getItem('userInfo');
                if (userInfoStr) {
                  const userInfo = JSON.parse(userInfoStr);
                  selectedBodyParts = userInfo.selected_body_parts;
                }
              } catch (error) {
                console.error('사용자 정보 파싱 오류:', error);
              }
              
              // 세션 생성 요청
              const createResponse = await fetch('/api/v1/sessions', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  body_parts: selectedBodyParts
                })
              });
              
              if (createResponse.ok) {
                const createData = await createResponse.json();
                console.log('새 세션 생성 성공:', createData);
                setSessionId(createData.session_id);
                localStorage.setItem('sessionId', createData.session_id);
              } else {
                console.error('새 세션 생성 실패:', createResponse.status);
                
                // 세션 생성 실패 시 온보딩 페이지로 이동
                console.log('세션 생성 실패, 온보딩 페이지로 이동합니다.');
                router.push('/onboarding');
                return;
              }
            } catch (createError) {
              console.error('세션 생성 오류:', createError);
              
              // 오류 발생 시 온보딩 페이지로 이동
              console.log('세션 생성 중 오류 발생, 온보딩 페이지로 이동합니다.');
              router.push('/onboarding');
              return;
            }
          }
          
          // 로그인 상태 확인
          const loggedIn = await checkUserLoggedIn();
          setIsLoggedIn(loggedIn);
        }
        
        // 세션 초기화 완료
        setIsInitializing(false);
        
      } catch (error) {
        console.error('세션 확인 오류:', error);
        
        // 오류 발생 시 로컬 스토리지의 세션 ID 사용
        const localSessionId = localStorage.getItem('sessionId');
        if (localSessionId) {
          console.log('오류 발생, 로컬 스토리지의 세션 ID 사용:', localSessionId);
          setSessionId(localSessionId);
        }
        
        setIsInitializing(false);
      }
    };

    checkSession();
  }, [router]);

  // 사용자 메시지 전송 처리
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log('메시지 전송 중:', message, '세션 ID:', sessionId);
      
      // 세션 ID가 없는 경우 처리
      if (!sessionId) {
        console.error('세션 ID가 없습니다. 스트레칭 API를 호출할 수 없습니다.');
        throw new Error('세션 ID가 없습니다');
      }
      
      // 메시지 유효성 검사
      if (!message.trim()) {
        console.error('메시지가 비어있습니다.');
        throw new Error('메시지가 비어있습니다');
      }
      
      // 메시지 길이 검사 (백엔드 요구사항: 최소 10글자)
      if (message.trim().length < 10) {
        console.error('메시지가 너무 짧습니다. 최소 10글자 이상 입력해야 합니다.');
        throw new Error('메시지가 너무 짧습니다');
      }
      
      // 로컬 스토리지에서 사용자 정보 가져오기
      const userInfoStr = localStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
      
      // 직접 백엔드 API 호출로 스트레칭 API 요청
      console.log('스트레칭 API 요청 중...');
      const response = await fetch(`/api/v1/sessions/${sessionId}/stretching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pain_description: message, // 사용자 입력을 그대로 전송
          selected_body_parts: userInfo?.selected_body_parts || '목, 어깨',
          occupation: userInfo?.job || '직장인',
          age: parseInt(userInfo?.age) || 30,
          gender: userInfo?.gender || '여성',
          lifestyle: userInfo?.dailyRoutine || '주 5일 근무, 하루 8시간 앉아서 일함',
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('스트레칭 API 응답 오류:', response.status);
        throw new Error(`스트레칭 API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      console.log('메시지 전송 성공:', data);
      
      // 응답 데이터에서 텍스트 추출 (객체인 경우 JSON 문자열로 변환)
      let responseText = '';
      if (typeof data === 'object' && data !== null) {
        console.log('객체 데이터 상세 내용:', JSON.stringify(data, null, 2));
        
        // 특정 필드 확인 (stretching_guide 필드를 우선 확인)
        if (data.stretching_guide) {
          responseText = data.stretching_guide;
        } else if (data.text) {
          responseText = data.text;
        } else if (data.content) {
          responseText = data.content;
        } else if (data.message) {
          responseText = data.message;
        } else {
          // 객체를 문자열로 변환하여 표시
          try {
            responseText = JSON.stringify(data, null, 2);
          } catch (e) {
            console.error('객체 변환 오류:', e);
            responseText = '응답 데이터를 표시할 수 없습니다.';
          }
        }
      } else if (typeof data === 'string') {
        responseText = data;
      } else {
        responseText = '응답을 받지 못했습니다.';
      }
      
      // 봇 응답 메시지 이벤트 발생 - 고유한 ID 생성
      const uniqueResponseId = Date.now() + Math.floor(Math.random() * 1000);
      console.log('봇 응답 메시지 ID 생성:', uniqueResponseId);
      
      const botMessageEvent = new CustomEvent('botMessage', {
        detail: {
          id: uniqueResponseId,
          text: data, // 전체 데이터 객체를 그대로 전달
          sender: 'bot',
        },
      });
      window.dispatchEvent(botMessageEvent);
      
      // 로딩 상태 해제
      setIsLoading(false);
      
      // 비회원 사용자인 경우 회원가입 유도 알림 표시
      const checkAndShowSignupPrompt = async () => {
        console.log('회원가입 유도 검사 시작, 현재 메시지 카운트:', messageCount);
        const isLoggedIn = await checkUserLoggedIn();
        console.log('로그인 상태 확인 결과:', isLoggedIn);
        setIsLoggedIn(isLoggedIn); // 로그인 상태 업데이트
        
        // 로그인 상태를 다시 확인하고, 로그인되지 않은 경우에만 회원가입 유도 메시지 표시
        if (!isLoggedIn) {
          console.log('비로그인 사용자 감지: 회원가입 유도 메시지 표시 예정');
          
          // 현재 메시지 카운트 기준으로 판단 (상태 업데이트 후의 값 사용)
          const currentCount = messageCount + 1; // 방금 증가된 카운트 반영
          console.log('현재 메시지 카운트:', currentCount);
          
          // 첫 번째 또는 두 번째 메시지 후에 회원가입 유도 메시지 표시
          if (currentCount === 1 || currentCount === 2) {
            console.log(`메시지 카운트(${currentCount})에 따른 회원가입 유도 메시지 표시 예정`);
            setTimeout(() => {
              // 회원가입 유도 알림 표시 전에 로그인 상태 한번 더 확인
              checkUserLoggedIn().then(finalCheck => {
                if (!finalCheck) {
                  console.log('회원가입 유도 메시지 표시');
                  // 고유한 ID 생성 (충돌 방지)
                  const signupPromptId = Date.now() + 9999 + Math.floor(Math.random() * 1000);
                  console.log('회원가입 유도 메시지 ID 생성:', signupPromptId);
                  
                  const signupPromptEvent = new CustomEvent('botMessage', {
                    detail: {
                      id: signupPromptId,
                      text: '계정을 만들면 스트레칭 히스토리를 저장하고 개인화된 추천을 받을 수 있다부기! 지금 가입하시겠어부기?',
                      sender: 'bot',
                      isSignupPrompt: true,
                    },
                  });
                  window.dispatchEvent(signupPromptEvent);
                } else {
                  console.log('최종 확인: 로그인된 사용자, 회원가입 유도 건너뜀');
                }
              });
            }, 2000); // 2초 후에 회원가입 유도 메시지 표시
          } else {
            console.log('회원가입 유도 조건 미충족, 현재 카운트:', currentCount);
          }
        } else {
          console.log('로그인된 사용자, 회원가입 유도 건너뜀');
        }
      };
      
      // 회원가입 유도 메시지 표시 함수 호출
      checkAndShowSignupPrompt();
    },
    onError: (error) => {
      console.error('메시지 전송 오류:', error);
      
      // 오류 메시지 생성
      let errorMessage = '죄송합니다. 메시지 전송 중 오류가 발생했습니다.';
      
      // 세션 ID 관련 오류인 경우
      if (error instanceof Error && error.message.includes('세션 ID가 없습니다')) {
        errorMessage = '세션 정보를 찾을 수 없습니다. 온보딩 페이지에서 정보를 입력해주세요.';
      } 
      // 빈 메시지 오류인 경우
      else if (error instanceof Error && error.message.includes('메시지가 비어있습니다')) {
        errorMessage = '메시지를 입력해주세요.';
      }
      // 메시지 길이 오류인 경우
      else if (error instanceof Error && error.message.includes('메시지가 너무 짧습니다')) {
        errorMessage = '통증에 대해 조금 더 자세히 설명해 주세요 (최소 10자 이상)';
      }
      // API 응답 오류인 경우
      else if (error instanceof Error && error.message.includes('스트레칭 API 응답 오류')) {
        errorMessage = '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
      }
      
      // 고유한 ID 생성 (충돌 방지)
      const errorMessageId = Date.now() + 8888 + Math.floor(Math.random() * 1000);
      console.log('오류 메시지 ID 생성:', errorMessageId);
      
      // 오류 메시지 이벤트 발생
      const errorMessageEvent = new CustomEvent('botMessage', {
        detail: {
          id: errorMessageId,
          text: errorMessage,
          sender: 'bot',
        },
      });
      window.dispatchEvent(errorMessageEvent);
      
      // 로딩 상태 해제
      setIsLoading(false);
    },
  });

  const handleSendMessage = (message: any) => {
    console.log('사용자 메시지 전송:', message);
    
    // 메시지가 객체인 경우 텍스트만 추출
    let messageText = message;
    if (typeof message === 'object' && message !== null) {
      try {
        if (message.text) {
          messageText = message.text;
        } else if (message.content) {
          messageText = message.content;
        } else if (message.message) {
          messageText = message.message;
        } else {
          messageText = JSON.stringify(message);
        }
        console.log('객체에서 텍스트 추출:', messageText);
      } catch (e) {
        console.error('메시지 객체 처리 오류:', e);
      }
    }
    
    // 로딩 상태 설정
    setIsLoading(true);
    
    // 메시지 카운트 증가 (회원가입 유도 목적)
    setMessageCount(prevCount => prevCount + 1);
    console.log('메시지 카운트 증가:', messageCount + 1);
    
    // 메시지 전송 뮤테이션 호출 - 추출된 텍스트 사용
    sendMessageMutation.mutate(messageText);
  };

  const handleGoToOnboarding = () => {
    router.push('/onboarding');
  };

  return (
    <main className="max-w-md flex flex-col items-start m-auto">
      <Gnb />
      <div
        className="w-full flex flex-col h-screen p-5 mt-[72px] message-container"
        style={{ height: 'calc(100vh - 126px)' }}
      >
        {isInitializing ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner initialMessage="세션을 불러오는 중이에요" />
          </div>
        ) : sessionId ? (
          isLoggedIn && !checkOnboardingCompleted() ? (
            // 로그인은 되어 있지만 온보딩이 완료되지 않은 경우
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-center text-lg">온보딩이 완료되지 않았습니다. 온보딩 페이지에서 정보를 입력해주세요.</p>
              <button 
                onClick={handleGoToOnboarding}
                className="px-4 py-2 bg-[#93D400] text-white rounded-md hover:bg-[#7eb300] transition-colors"
              >
                온보딩 페이지로 이동
              </button>
            </div>
          ) : (
            // 정상적인 채팅 인터페이스 표시
            <ChatInterface 
              sessionId={sessionId}
              initialMessages={initialMessages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          )
        ) : (
          // 세션 ID가 없는 경우
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-center text-lg">세션 정보가 없습니다. 온보딩 페이지에서 정보를 입력해주세요.</p>
            <button 
              onClick={handleGoToOnboarding}
              className="px-4 py-2 bg-[#93D400] text-white rounded-md hover:bg-[#7eb300] transition-colors"
            >
              온보딩 페이지로 이동
            </button>
          </div>
        )}
      </div>
      <Fnb />
    </main>
  );
}
