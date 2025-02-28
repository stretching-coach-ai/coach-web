import { useState, useEffect, useRef } from 'react';
import { Stardust } from '../app/fonts';
import { LoadingSpinner } from './LoadingSpinner';
import Image from 'next/image';
import { User } from 'lucide-react';

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
  initialMessages = [{ id: Date.now() - 1000, text: '어떻게 아프냐부기?', sender: 'bot' }],
  onSendMessage,
  isLoading: parentIsLoading,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  // 부모 컴포넌트의 로딩 상태 변경 감지
  useEffect(() => {
    if (parentIsLoading !== undefined) {
      setIsLoading(parentIsLoading);
    }
  }, [parentIsLoading]);

  // 초기 메시지 설정 (한 번만 실행)
  useEffect(() => {
    if (!initializedRef.current && initialMessages.length > 0) {
      console.log('초기 메시지 설정 (props):', initialMessages);
      // 중복 메시지 방지를 위해 기존 메시지와 비교하지 않고 한 번만 설정
      setMessages(initialMessages);
      initializedRef.current = true;
    }
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // botMessage 이벤트 리스너 추가
  useEffect(() => {
    const handleBotMessage = (event: CustomEvent) => {
      const botMessage = event.detail as Message;
      console.log('봇 메시지 이벤트 수신:', botMessage);
      
      // 중복 메시지 방지
      setMessages((prev) => {
        // 이미 같은 ID의 메시지가 있는지 확인
        const isDuplicate = prev.some(msg => msg.id === botMessage.id);
        if (isDuplicate) {
          console.log('중복 메시지 무시:', botMessage);
          return prev;
        }
        
        return [...prev, botMessage];
      });
    };

    // 이벤트 리스너 등록
    window.addEventListener('botMessage', handleBotMessage as EventListener);
    console.log('botMessage 이벤트 리스너 등록됨');

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('botMessage', handleBotMessage as EventListener);
      console.log('botMessage 이벤트 리스너 제거됨');
    };
  }, []);

  // 메시지 목록이 변경될 때마다 로그 출력
  useEffect(() => {
    console.log('메시지 목록 업데이트됨:', messages);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

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

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // 입력창 초기화
    const userInput = input;
    setInput('');
    
    // 외부 핸들러가 있으면 호출 (부모 컴포넌트에서 로딩 상태 관리)
    if (onSendMessage) {
      onSendMessage(userInput);
      return;
    }
    
    // 외부 핸들러가 없는 경우에만 내부에서 로딩 상태 관리
    setIsLoading(true);
    
    // 대화 컨텍스트 API 호출 (후속 질문 처리)
    try {
      // 로딩 메시지 추가
      const loadingMessage: Message = {
        id: Date.now() + 1,
        text: '답변을 생성하고 있어요...',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, loadingMessage]);

      // 대화 컨텍스트 API 호출
      const response = await fetch(`/api/v1/sessions/${sessionId}/conversation/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userInput,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      // 스트리밍 응답 처리
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('응답 본문을 읽을 수 없습니다');
      }

      // 로딩 메시지 제거
      setMessages((prev) => prev.filter(msg => msg.id !== loadingMessage.id));

      // 새 응답 메시지 추가
      const responseMessage: Message = {
        id: Date.now() + 2,
        text: '',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, responseMessage]);

      // 스트리밍 데이터 처리
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (done) break;

        // 디코딩 및 버퍼에 추가
        const text = decoder.decode(value, { stream: true });
        buffer += text;

        // 완전한 SSE 메시지 처리
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.content) {
                // 응답 메시지 업데이트
                setMessages((prev) => 
                  prev.map((msg) => 
                    msg.id === responseMessage.id 
                      ? { ...msg, text: msg.text + data.content } 
                      : msg
                  )
                );
              }
              
              if (data.done) {
                // 스트리밍 완료
                done = true;
                break;
              }
            } catch (e) {
              console.error('SSE 데이터 파싱 오류:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('대화 요청 오류:', error);
      
      // 오류 메시지 추가
      const errorMessage: Message = {
        id: Date.now() + 3,
        text: '죄송합니다, 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
      
      // 최종 텍스트 조합
      return { __html: processedMainContent + '<h3 class="text-[#6B925C] font-bold text-lg mt-2 mb-1">[참고 자료]</h3>' + processedReferences };
    }
    
    // 줄바꿈 처리
    let formattedText = textStr.split('\n').map((line: string, i: number) => {
      // 섹션 제목 스타일링
      line = line.replace(sectionPattern, '<span class="font-bold text-green-700">[$1]</span>');
      
      // 마크다운 링크 변환 (예: [출처](http://example.com))
      line = line.replace(markdownLinkPattern, (match: string, text: string, url: string) => {
        const normalizedUrl = normalizeUrl(url);
        return `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline break-all">${text}</a>`;
      });
      
      // 일반 URL 변환 (http://로 시작하는 URL)
      line = line.replace(urlPattern, (match: string) => {
        const normalizedUrl = normalizeUrl(match);
        return `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline break-all">${normalizedUrl}</a>`;
      });
      
      // 볼드 텍스트 처리 (**텍스트**)
      line = line.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold">$1</span>');
      
      // 단계 번호 처리 (1., 2., 3. 등)
      line = line.replace(/^(\s*)(\d+)\.\s+(.*)$/g, '$1<span class="font-semibold">$2.</span> $3');
      
      // 목록 항목 처리 (- 또는 * 로 시작하는 줄)
      line = line.replace(/^(\s*)[-*]\s+(.*)$/g, '$1• $2');
      
      // 소제목 처리 (예: 상태:, 위험:, 개선점: 등)
      line = line.replace(/^(\s*)(상태|위험|개선점|스트레칭|생활수칙|주의사항|호흡|반복 횟수|단계):\s*(.*)$/g, 
        '$1<span class="font-semibold text-green-600">$2:</span> $3');
      
      return line;
    }).join('<br />');
    
    // 스트레칭 번호 처리 (1. **비복근 스트레칭** 등)
    formattedText = formattedText.replace(/(\d+)\.\s+<span class="font-bold">(.*?)<\/span>/g, 
      '<div class="mt-3 mb-1"><span class="inline-block bg-green-100 text-green-800 rounded-full px-2 py-1 text-sm font-semibold mr-1">$1</span> <span class="font-bold">$2</span></div>');
    
    return { __html: formattedText };
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className={`${Stardust.className} flex-1 overflow-y-auto p-2 space-y-[42px]`}>
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">메시지가 없습니다.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              {message.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-[#F9FFEB] flex items-center justify-center mr-2 flex-shrink-0">
                  <Image
                    src="/assets/bugi-head.png"
                    alt="부기 캐릭터"
                    width={24}
                    height={24}
                  />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-[#6B925C] text-white'
                    : 'bg-[#F9FFEB] text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {(() => {
                    // 간단한 메시지 텍스트 처리 로직
                    let textContent = '';
                    
                    if (typeof message.text === 'object' && message.text !== null) {
                      // 객체에서 stretching_guide 필드 우선 사용
                      if (message.text.stretching_guide) {
                        textContent = message.text.stretching_guide;
                      } 
                      // 다음으로 text 필드 사용
                      else if (message.text.text) {
                        textContent = message.text.text;
                      } 
                      // 다음으로 content 필드 사용
                      else if (message.text.content) {
                        textContent = message.text.content;
                      } 
                      // 다음으로 message 필드 사용
                      else if (message.text.message) {
                        textContent = message.text.message;
                      } 
                      // 알려진 필드가 없으면 JSON 문자열로 변환
                      else {
                        textContent = JSON.stringify(message.text, null, 2);
                      }
                    } else {
                      // 문자열이거나 다른 타입인 경우 문자열로 변환
                      textContent = String(message.text || '');
                    }
                    
                    // 메시지가 사용자 메시지인 경우 단순 텍스트로 표시
                    if (message.sender === 'user') {
                      return <pre className="whitespace-pre-wrap font-sans">{textContent}</pre>;
                    }
                    
                    // 봇 메시지인 경우 formatText 함수를 사용하여 링크 등을 처리
                    return <div dangerouslySetInnerHTML={formatText(textContent)} />;
                  })()}
                  
                  {/* 회원가입 유도 메시지인 경우 버튼 표시 */}
                  {message.isSignupPrompt && (
                    <div className="mt-3 flex flex-col space-y-2">
                      <a 
                        href="/signup" 
                        className="bg-[#93D400] text-white px-4 py-2 rounded-md text-center hover:bg-[#7CB305] transition-colors"
                      >
                        회원가입하기
                      </a>
                      <button 
                        className="text-gray-500 text-sm hover:underline"
                        onClick={() => {
                          // 다음에 하기 버튼 클릭 시 메시지 추가
                          const declineMessage: Message = {
                            id: Date.now(),
                            text: '다음에 가입할게요. 지금은 계속 진행할게요.',
                            sender: 'user',
                          };
                          setMessages((prev) => [...prev, declineMessage]);
                          
                          // 봇 응답 메시지 추가
                          setTimeout(() => {
                            const botResponse: Message = {
                              id: Date.now() + 1,
                              text: '네, 알겠습니다. 언제든지 회원가입하실 수 있어요. 계속해서 도와드릴게요!',
                              sender: 'bot',
                            };
                            setMessages((prev) => [...prev, botResponse]);
                          }, 1000);
                        }}
                      >
                        다음에 할게요
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#6B925C] flex items-center justify-center ml-2 flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#F7FFE5] self-start rounded-[15px] rounded-tl-[0px] text-[18px] max-w-[85%] w-fit shadow-sm overflow-hidden break-words p-3">
              <LoadingSpinner message="꾸부기가 답변을 생각하고 있어요" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center p-3 pl-[35px] bg-[#E4FFA8] rounded-full text-[19px] mt-4">
        <input
          type="text"
          className="flex-1 focus:outline-none bg-transparent"
          placeholder={isLoading ? "답변을 생성 중입니다..." : "통증에 대해 10자 이상 설명해주세요"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim() || input.trim().length < 10}
          className="ml-2 p-2 rounded-full bg-[#D1F280] disabled:opacity-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <p className="text-[10px] mx-auto mt-[9px]">
        꾸부기는 실수를 할 수 있습니다. 중요한 정보를 확인하세요.
      </p>
    </div>
  );
}; 