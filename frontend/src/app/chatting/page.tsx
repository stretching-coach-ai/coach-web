'use client';

import { useState, useEffect, useRef } from 'react';
import { Gnb } from '@/components/Gnb';
import { Fnb } from '@/components/Fnb';
import { ChatInterface } from '@/components/ChatInterface';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

// API 기본 URL 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function ChatUI() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const sessionInitializedRef = useRef(false);

  // 고유한 ID를 가진 초기 메시지 설정
  const initialMessages: Message[] = [
    { id: Date.now() - 1000, text: '어떻게 아프냐부기?', sender: 'bot' },
  ];

  // 현재 세션 정보 가져오기
  useEffect(() => {
    // 이미 초기화 중이거나 완료된 경우 중복 호출 방지
    if (sessionInitializedRef.current) {
      return;
    }
    
    sessionInitializedRef.current = true;
    
    const fetchCurrentSession = async () => {
      try {
        setIsInitializing(true);
        
        // 프록시 API를 통해 현재 세션 정보 가져오기
        console.log('세션 정보 요청 중...');
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: '/api/v1/sessions/current',
            method: 'GET'
          })
        });

        // 세션이 있는 경우 (로그인 또는 이전에 생성된 비회원 세션)
        if (response.ok) {
          const data = await response.json();
          console.log('현재 세션 정보 조회 성공:', data);
          
          if (data && data.session_id) {
            console.log('기존 세션 ID 사용:', data.session_id);
            setSessionId(data.session_id);
            setIsInitializing(false);
            return;
          }
        } 
        // 세션이 없는 경우 (401) 또는 API 오류 (404 등)
        else {
          console.log(`세션 정보 조회 결과 (${response.status}): 새 세션 생성 필요`);
        }
        
        // 세션 ID가 없으면 새로 생성 요청 (비회원 세션)
        console.log('비회원 세션 생성 요청 중...');
        const createResponse = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: '/api/v1/sessions',
            method: 'POST',
            data: {}
          })
        });
        
        if (!createResponse.ok) {
          throw new Error(`비회원 세션 생성에 실패했습니다. 상태 코드: ${createResponse.status}`);
        }
        
        const createData = await createResponse.json();
        console.log('비회원 세션 생성 완료:', createData);
        
        if (createData && createData.session_id) {
          setSessionId(createData.session_id);
        } else {
          console.error('세션 ID가 응답에 없습니다:', createData);
          throw new Error('세션 ID를 받지 못했습니다.');
        }
      } catch (error) {
        console.error('세션 관리 오류:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchCurrentSession();
  }, []);

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
      
      // 프록시 API를 통해 스트레칭 API 호출
      console.log('스트레칭 API 요청 중...');
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: `/api/v1/sessions/${sessionId}/stretching`,
          method: 'POST',
          data: {
            pain_description: message, // 사용자 입력을 그대로 전송
            selected_body_parts: userInfo?.selected_body_parts || '목, 어깨',
            occupation: userInfo?.job || '직장인',
            age: parseInt(userInfo?.age) || 30,
            gender: userInfo?.gender || '여성',
            lifestyle: userInfo?.dailyRoutine || '주 5일 근무, 하루 8시간 앉아서 일함',
          }
        }),
      });

      if (!response.ok) {
        console.error('스트레칭 API 응답 오류:', response.status);
        throw new Error(`스트레칭 API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('스트레칭 API 응답 데이터:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('메시지 전송 성공:', data);
      // 봇 응답 메시지 이벤트 발생
      const botMessageEvent = new CustomEvent('botMessage', {
        detail: {
          id: Date.now(),
          text: data.text || '응답을 받지 못했습니다.',
          sender: 'bot',
        },
      });
      window.dispatchEvent(botMessageEvent);
      
      // 로딩 상태 해제
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('메시지 전송 오류:', error);
      
      // 오류 메시지 생성
      let errorMessage = '죄송합니다. 메시지 전송 중 오류가 발생했습니다.';
      
      // 세션 ID 관련 오류인 경우
      if (error instanceof Error && error.message.includes('세션 ID가 없습니다')) {
        errorMessage = '세션 정보를 찾을 수 없습니다. 페이지를 새로고침 해주세요.';
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
      // CORS 오류인 경우
      else if (error instanceof Error && error.message.includes('CORS')) {
        errorMessage = '서버 연결에 문제가 있습니다. 관리자에게 문의해주세요.';
        console.error('CORS 오류 발생:', error.message);
      }
      // 네트워크 오류인 경우
      else if (error instanceof Error && error.message.includes('Failed to fetch')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
        console.error('네트워크 오류 발생:', error.message);
      }
      
      // 오류 메시지 이벤트 발생
      const errorMessageEvent = new CustomEvent('botMessage', {
        detail: {
          id: Date.now(),
          text: errorMessage,
          sender: 'bot',
        },
      });
      window.dispatchEvent(errorMessageEvent);
      
      // 로딩 상태 해제
      setIsLoading(false);
    },
  });

  const handleSendMessage = (message: string) => {
    console.log('사용자 메시지 전송:', message);
    // 사용자 메시지 이벤트 발생
    const userMessageEvent = new CustomEvent('botMessage', {
      detail: {
        id: Date.now(),
        text: message,
        sender: 'user',
      },
    });
    window.dispatchEvent(userMessageEvent);
    
    // 로딩 상태 설정
    setIsLoading(true);
    
    // API 요청
    sendMessageMutation.mutate(message);
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
          <ChatInterface 
            sessionId={sessionId}
            initialMessages={initialMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner initialMessage="세션 정보를 가져오지 못했습니다. 새로고침 해주세요." />
          </div>
        )}
      </div>
      <Fnb />
    </main>
  );
}
