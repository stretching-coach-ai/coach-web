'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stardust } from '@/app/fonts';
import { LoadingSpinner } from './LoadingSpinner';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'kkubugi';
}

export const KkubugiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: '안녕하세요! 저는 꾸부기입니다. 건강과 스트레칭에 관한 질문이 있으시면 무엇이든 물어보세요부기!',
      sender: 'kkubugi',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 스크롤을 항상 최신 메시지로 유지
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 텍스트 영역의 높이 자동 조절
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  // 메시지 전송 함수
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now(),
      content: input.trim(),
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 텍스트 영역 높이 리셋
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      // 꾸부기의 응답 ID 미리 생성
      const kkubugiResponseId = Date.now() + 1;
      
      // 빈 꾸부기 메시지 미리 추가
      setMessages(prev => [...prev, {
        id: kkubugiResponseId,
        content: '',
        sender: 'kkubugi',
      }]);

      // 백엔드 API 요청 시작
      const response = await fetch('/api/v1/kkubugi/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('API 요청에 실패했습니다.');
      }

      // 스트리밍 응답 처리
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('응답 본문을 읽을 수 없습니다.');
      }

      const decoder = new TextDecoder();
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 청크 디코딩
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            // 완료 신호 확인
            if (data === '[DONE]') continue;

            try {
              // 백엔드에서는 직접 텍스트 데이터를 보냄 (JSON이 아님)
              responseText += data;
              
              // 누적된 응답으로 꾸부기 메시지 업데이트
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === kkubugiResponseId 
                    ? { ...msg, content: responseText } 
                    : msg
                )
              );
            } catch (e) {
              console.error('응답 처리 오류:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('메시지 전송 오류:', error);
      
      // 오류 메시지 추가
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        content: '죄송합니다, 응답을 처리하는 중에 오류가 발생했습니다부기! 다시 시도해 주세요부기.',
        sender: 'kkubugi',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키로 메시지 전송 (Shift+Enter는 줄바꿈)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full flex flex-col h-full max-w-md mx-auto bg-white">
      <div className={`${Stardust.className} flex-1 overflow-y-auto p-4 space-y-8`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 ${
                message.sender === 'user'
                  ? 'bg-[#E4FFA9] text-[#333333] self-end rounded-[15px] rounded-tr-[0px] flex justify-end text-[18px] max-w-xs w-fit'
                  : 'bg-[#F7FFE5] text-[#333333] self-start rounded-[15px] rounded-tl-[0px] text-[16px] max-w-[85%] w-fit shadow-sm overflow-hidden break-words'
              }`}
            >
              {message.content || (message.sender === 'kkubugi' && isLoading && (
                <LoadingSpinner initialMessage="생각중이에요부기" />
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 fixed bottom-16 left-0 right-0 max-w-md mx-auto">
        <div className="flex items-center p-3 pl-5 bg-[#E4FFA8] rounded-full text-[16px]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyPress}
            placeholder={isLoading ? "답변을 생성 중입니다..." : "꾸부기에게 질문하세요..."}
            className="flex-1 focus:outline-none bg-transparent text-[#333333] resize-none overflow-hidden max-h-[80px]"
            style={{ height: '24px' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="ml-2 p-2 rounded-full bg-[#D1F280] disabled:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="text-[10px] mx-auto mt-2 text-center text-gray-500">
          꾸부기는 실수를 할 수 있습니다. 중요한 정보를 확인하세요.
        </p>
      </div>
    </div>
  );
}; 