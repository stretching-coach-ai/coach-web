import { useState, useEffect, useRef } from 'react';
import { Stardust } from '../app/fonts';
import { LoadingSpinner } from './LoadingSpinner';
import Image from 'next/image';
import { User, Send, ArrowUp } from 'lucide-react';

interface Message {
  id: number;
  text: string | any;
  sender: 'user' | 'bot';
  isSignupPrompt?: boolean;
}

interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

export const ChatInterface = ({
  sessionId,
  initialMessages = [{ id: 1, text: '어떻게 아프냐부기?', sender: 'bot' }],
  onSendMessage,
  isLoading: parentIsLoading,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const botMessageListenerRef = useRef<((event: Event) => void) | null>(null);
  const messageIds = new Set<number>();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 부모 컴포넌트의 로딩 상태 변경 감지
  useEffect(() => {
    if (parentIsLoading !== undefined) {
      setIsLoading(parentIsLoading);
    }
  }, [parentIsLoading]);

  // 초기 메시지 설정 (한 번만 실행)
  useEffect(() => {
    if (!initializedRef.current) {
      console.log('초기 메시지 설정 (props):', initialMessages);
      
      // 초기 메시지의 ID를 Set에 추가하여 중복 방지
      initialMessages.forEach(msg => {
        messageIds.add(msg.id);
      });
      
      // 중복 메시지 방지를 위해 기존 메시지와 비교하지 않고 한 번만 설정
      setMessages(initialMessages);
      initializedRef.current = true;
      
      // 세션 ID를 localStorage에 저장 (마이그레이션을 위해)
      if (sessionId) {
        console.log('ChatInterface: 세션 ID 로컬 스토리지에 저장:', sessionId);
        localStorage.setItem('sessionId', sessionId);
      }
    }
  }, []);  // 의존성 배열을 비워서 컴포넌트 마운트 시 한 번만 실행되도록 함

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // botMessage 이벤트 리스너 추가
  useEffect(() => {
    const handleBotMessage = (event: any) => {
      const { detail } = event;
      console.log('봇 메시지 이벤트 수신:', detail);
      
      // 중복 메시지 방지를 위한 ID 확인 - Set을 사용하여 더 강력한 중복 체크
      if (!messageIds.has(detail.id)) {
        messageIds.add(detail.id);
        
        // 추가로 메시지 내용 기반 중복 체크 (텍스트와 발신자가 동일한 최근 메시지 확인)
        const isDuplicate = messages.some(msg => 
          msg.sender === detail.sender && 
          JSON.stringify(msg.text) === JSON.stringify(detail.text) &&
          Date.now() - msg.id < 3000 // 3초 이내에 동일한 내용의 메시지가 있는지 확인
        );
        
        if (!isDuplicate) {
          setMessages((prevMessages) => [...prevMessages, detail]);
          
          // 회원가입 유도 메시지인 경우 로그 출력
          if (detail.isSignupPrompt) {
            console.log('회원가입 유도 메시지 표시됨:', detail);
          }
        } else {
          console.log('내용 기반 중복 메시지 감지됨, 무시:', detail);
        }
      } else {
        console.log('ID 기반 중복 메시지 무시:', detail);
      }
    };

    // 이전 이벤트 리스너 제거 후 새로 등록 (중복 등록 방지)
    if (botMessageListenerRef.current) {
      window.removeEventListener('botMessage', botMessageListenerRef.current);
    }
    
    botMessageListenerRef.current = handleBotMessage;
    window.addEventListener('botMessage', handleBotMessage);
    
    return () => {
      if (botMessageListenerRef.current) {
        window.removeEventListener('botMessage', botMessageListenerRef.current);
      }
    };
  }, [messages]); // messages 의존성 추가하여 최신 메시지 목록 기반으로 중복 체크

  // 메시지 목록이 변경될 때마다 로그 출력
  useEffect(() => {
    console.log('메시지 목록 업데이트됨:', messages);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // 입력 길이 검증 (최소 10글자)
    if (input.trim().length < 10) {
      const errorMessage: Message = {
        id: Date.now(),
        text: '통증에 대해 조금 더 자세히 설명해 주세요 (최소 10자 이상)',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // 사용자 메시지 생성
    const userMessageId = Date.now();
    const userMessage: Message = {
      id: userMessageId,
      text: input,
      sender: 'user',
    };
    
    // 메시지 ID 추적을 위해 Set에 추가
    messageIds.add(userMessageId);
    
    // 사용자 메시지 추가
    setMessages((prev) => [...prev, userMessage]);

    // 입력창 초기화
    const userInput = input;
    setInput('');

    // 외부 핸들러가 있으면 호출 (부모 컴포넌트에서 API 호출 및 로딩 상태 관리)
    if (onSendMessage) {
      onSendMessage(userInput);
      return; // 여기서 중요: 부모 컴포넌트가 API 호출을 처리하도록 여기서 종료
    }
    
    // 이하 코드는 외부 핸들러가 없을 때만 실행됨 (독립 실행 모드)
    setIsLoading(true);
    
    // ... 기존 API 호출 코드 유지 ...
  };

  // URL을 감지하여 링크로 변환하는 함수
  const formatText = (text: string | any): { __html: string } => {
    // 디버깅 로그 추가
    console.log('formatText 입력값:', text);
    console.log('formatText 입력 타입:', typeof text);
    
    // 객체인 경우 문자열로 변환
    if (typeof text === 'object' && text !== null) {
      try {
        // 객체 내용 로깅
        console.log('객체 내용:', JSON.stringify(text, null, 2));
        
        // 객체에 특정 필드가 있는지 확인 (우선순위: ai_response > stretching_guide > text > content > message)
        if (text.ai_response) {
          text = text.ai_response;
        } else if (text.stretching_guide) {
          text = text.stretching_guide;
        } else if (text.text) {
          text = text.text;
        } else if (text.content) {
          text = text.content;
        } else if (text.message) {
          text = text.message;
        } else {
          // 알려진 필드가 없으면 전체 객체를 문자열로 변환
          text = JSON.stringify(text, null, 2);
        }
        console.log('객체를 문자열로 변환:', text);
      } catch (e) {
        console.error('객체 변환 오류:', e);
        text = '[객체를 표시할 수 없습니다]';
      }
    } else if (text === undefined || text === null) {
      text = '';
    } else if (typeof text !== 'string') {
      // 문자열이 아닌 경우 문자열로 변환
      text = String(text);
    }
    
    // 이제 text는 확실히 문자열입니다
    const textStr = text as string;
    console.log('최종 변환된 텍스트:', textStr.substring(0, 100) + (textStr.length > 100 ? '...' : ''));
    
    // 섹션 제목 형식 (예: [분석], [가이드], [참고 자료])
    const sectionPattern = /\[(.*?)\]/g;
    
    // 다양한 URL 패턴 처리
    // 1. [출처](URL) 형식 - 마크다운 링크
    const markdownLinkPattern = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
    // 2. 일반 URL 형식 - 마침표, 쉼표, 괄호 등으로 끝나는 경우 제외
    const urlPattern = /(https?:\/\/[^\s,)"'<>]+)/g;
    
    // URL 정규화 함수 - URL 끝에 있는 특수문자 제거
    const normalizeUrl = (url: string): string => {
      // URL 끝에 있는 특수문자 제거 (마침표, 쉼표, 괄호 등)
      let cleanUrl = url.replace(/[.,;:!?)"'\]>]+$/, '');
      // URL에 포함된 공백 제거
      cleanUrl = cleanUrl.trim();
      return cleanUrl;
    };
    
    // 참고 자료 섹션 찾기
    const referenceSection = textStr.includes('[참고 자료]') ? 
      textStr.split('[참고 자료]')[1] : '';
    
    // 참고 자료가 있으면 별도 처리
    if (referenceSection) {
      // 참고 자료 섹션 제외한 본문
      const mainContent = textStr.split('[참고 자료]')[0];
      
      // 본문에서 마크다운 링크 변환
      let processedMainContent = mainContent.replace(
        /\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, 
        '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>'
      );
      
      // 참고 자료 섹션의 마크다운 링크 변환
      const processedReferences = referenceSection.replace(
        /- \[(.*?)\]\((https?:\/\/[^\s]+)\)/g, 
        '- <a href="$2" target="_blank" class="block py-1 text-blue-500 underline">$1</a>'
      );
      
      // 줄바꿈 처리
      processedMainContent = processedMainContent.replace(/\n/g, '<br>');
      
      // 볼드 텍스트 처리
      processedMainContent = processedMainContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // 섹션 제목 강조
      processedMainContent = processedMainContent.replace(
        sectionPattern, 
        '<div class="font-bold text-[#6B925C] mt-3 mb-1">$1</div>'
      );
      
      // 최종 HTML 조합
      const finalHtml = `
        ${processedMainContent}
        <div class="font-bold text-[#6B925C] mt-4 mb-2">참고 자료</div>
        <div class="pl-2">${processedReferences}</div>
      `;
      
      return { __html: finalHtml };
    }
    
    // 참고 자료가 없는 경우 기본 처리
    let processedText = textStr;
    
    // 마크다운 링크 변환
    processedText = processedText.replace(
      markdownLinkPattern, 
      '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>'
    );
    
    // 일반 URL 변환 (마크다운 링크가 아닌 경우)
    processedText = processedText.replace(urlPattern, (match) => {
      const normalizedUrl = normalizeUrl(match);
      return `<a href="${normalizedUrl}" target="_blank" class="text-blue-500 underline">${normalizedUrl}</a>`;
    });
    
    // 줄바꿈 처리
    processedText = processedText.replace(/\n/g, '<br>');
    
    // 볼드 텍스트 처리
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 섹션 제목 강조
    processedText = processedText.replace(
      sectionPattern, 
      '<div class="font-bold text-[#6B925C] mt-3 mb-1">$1</div>'
    );
    
    return { __html: processedText };
  };

  // 텍스트 영역의 높이 자동 조절
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = '56px'; // 기본 높이로 초기화
      const newHeight = Math.min(textarea.scrollHeight, 120);
      if (newHeight > 56) {
        textarea.style.height = `${newHeight}px`;
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                message.sender === 'user'
                  ? 'bg-[#E4FFA9] text-[#333333] self-end rounded-[15px] rounded-tr-[0px] flex justify-end text-[18px] w-fit'
                  : 'bg-[#F7FFE5] text-[#333333] self-start rounded-[15px] rounded-tl-[0px] text-[16px] w-fit shadow-sm border border-[#E5FFA9]'
              }`}
            >
              {message.sender === 'bot' && (
                <div className="flex items-center mb-1">
                  <div className="w-6 h-6 mr-1 relative">
                    <Image
                      src="/assets/bugi-head.png"
                      alt="꾸부기"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className={`${Stardust.className} text-[#6B925C] text-sm font-bold`}>꾸부기</span>
                </div>
              )}
              
              {message.isSignupPrompt ? (
                <div className="bg-[#F0F9E0] p-3 rounded-lg border border-[#93D400] mt-2">
                  <p className="text-[#6B925C] font-medium mb-2">
                    회원가입하고 더 많은 기능을 이용해보세요!
                  </p>
                  <div className="flex space-x-2">
                    <a
                      href="/auth/signup"
                      className="bg-[#93D400] text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-[#7eb300] transition-colors"
                    >
                      회원가입
                    </a>
                    <a
                      href="/auth/login"
                      className="bg-white text-[#6B925C] border border-[#6B925C] px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      로그인
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  className={`${message.sender === 'user' ? 'text-[#333333]' : 'text-[#333333]'}`}
                  dangerouslySetInnerHTML={formatText(message.text)}
                />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] w-full bg-[#F7FFE5] rounded-2xl p-3 rounded-tl-none border border-[#E5FFA9]">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 mr-1 relative">
                  <Image
                    src="/assets/bugi-head.png"
                    alt="꾸부기"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className={`${Stardust.className} text-[#6B925C] text-sm font-bold`}>꾸부기</span>
              </div>
              <LoadingSpinner message="응답을 생성하고 있다부기..." />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={isLoading ? "답변을 생성 중입니다..." : "꾸부기에게 질문하세요..."}
            className="w-full px-6 py-4 pr-16 bg-[#E4FFA8] rounded-full focus:outline-none resize-none overflow-hidden text-[#999999]"
            style={{ height: '56px' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 h-12 w-12 flex items-center justify-center text-white rounded-full disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-[#D1F280] rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
        <p className="text-[10px] mx-auto mt-2 text-center text-gray-500">
          꾸부기는 실수를 할 수 있습니다. 중요한 정보를 확인하세요.
        </p>
      </div>
    </div>
  );
}; 