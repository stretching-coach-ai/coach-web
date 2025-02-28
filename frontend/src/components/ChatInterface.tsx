import { useState, useEffect, useRef } from 'react';
import { Stardust } from '../app/fonts';
import { LoadingSpinner } from './LoadingSpinner';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
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
      // 중복 메시지 방지를 위해 기존 메시지와 비교
      const uniqueMessages = initialMessages.filter(
        (newMsg) => !messages.some((existingMsg) => existingMsg.id === newMsg.id)
      );
      
      if (uniqueMessages.length > 0) {
        setMessages((prev) => [...prev, ...uniqueMessages]);
      }
      
      initializedRef.current = true;
    }
  }, [initialMessages, messages]);

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
        console.log('이전 메시지 목록:', prev);
        
        // 이미 같은 ID의 메시지가 있는지 확인
        const isDuplicate = prev.some(msg => msg.id === botMessage.id);
        if (isDuplicate) {
          console.log('중복 메시지 무시:', botMessage);
          return prev;
        }
        
        const newMessages = [...prev, botMessage];
        console.log('새 메시지 목록:', newMessages);
        return newMessages;
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
  const formatText = (text: string) => {
    // 섹션 제목 형식 (예: [분석], [가이드], [참고 자료])
    const sectionPattern = /\[(.*?)\]/g;
    
    // 다양한 URL 패턴 처리
    // 1. [출처](URL) 형식 - 마크다운 링크
    const markdownLinkPattern = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
    // 2. 일반 URL 형식 - 마침표, 쉼표, 괄호 등으로 끝나는 경우 제외
    const urlPattern = /(https?:\/\/[^\s,)"'<>]+)/g;
    
    // URL 정규화 함수 - URL 끝에 있는 특수문자 제거
    const normalizeUrl = (url: string) => {
      // URL 끝에 있는 특수문자 제거 (마침표, 쉼표, 괄호 등)
      let cleanUrl = url.replace(/[.,;:!?)"'\]>]+$/, '');
      // URL에 포함된 공백 제거
      cleanUrl = cleanUrl.trim();
      return cleanUrl;
    };
    
    // 참고 자료 섹션 찾기
    const sections = text.split(/\[(.*?)\]/g).filter(Boolean);
    let enhancedText = text;
    
    // 참고 자료 섹션 특별 처리
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].trim() === '참고 자료' || sections[i].trim() === 'References') {
        // 다음 섹션이 있으면 (참고 자료 섹션의 내용)
        if (i + 1 < sections.length) {
          const refContent = sections[i + 1];
          
          // 참고 자료 섹션 내용에서 URL만 추출하여 간결하게 표시
          let enhancedRefContent = '';
          let hasLinks = false;
          
          // 마크다운 링크 추출
          const markdownLinks = [...refContent.matchAll(markdownLinkPattern)];
          markdownLinks.forEach(match => {
            hasLinks = true;
            const normalizedUrl = normalizeUrl(match[2]);
            enhancedRefContent += `<div class="my-2 p-2 bg-blue-50 rounded"><a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium underline">관련 문서</a></div>`;
          });
          
          // 일반 URL 추출
          if (!hasLinks) {
            const urlMatches = [...refContent.matchAll(urlPattern)];
            urlMatches.forEach(match => {
              hasLinks = true;
              const normalizedUrl = normalizeUrl(match[0]);
              enhancedRefContent += `<div class="my-2 p-2 bg-blue-50 rounded"><a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium underline">관련 문서</a></div>`;
            });
          }
          
          // URL이 없는 경우 각 줄에서 URL 패턴 확인
          if (!hasLinks) {
            const lines = refContent.trim().split('\n');
            lines.forEach(line => {
              const urlMatch = line.match(urlPattern);
              if (urlMatch) {
                const normalizedUrl = normalizeUrl(urlMatch[0]);
                enhancedRefContent += `<div class="my-2 p-2 bg-blue-50 rounded"><a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium underline">관련 문서</a></div>`;
              }
              // URL이 없는 경우 아무것도 표시하지 않음 (원본 논문 데이터 출력 안함)
            });
          }
          
          // 원본 텍스트에서 참고 자료 섹션 내용 교체
          if (enhancedRefContent) {
            enhancedText = enhancedText.replace(refContent, enhancedRefContent);
          } else {
            // URL이 없는 경우 참고 자료 섹션 내용을 빈 문자열로 대체
            enhancedText = enhancedText.replace(refContent, '');
          }
        }
        break;
      }
    }
    
    // 줄바꿈 처리
    let formattedText = enhancedText.split('\n').map((line, i) => {
      // 섹션 제목 스타일링 - 참고 자료 섹션은 특별 처리
      if (line.includes('[참고 자료]') || line.includes('[References]')) {
        line = line.replace(sectionPattern, '<span class="font-bold text-blue-600">[$1]</span>');
      } else {
        line = line.replace(sectionPattern, '<span class="font-bold text-green-700">[$1]</span>');
      }
      
      // 참고 자료 섹션이 아닌 경우에만 일반 링크 처리 적용
      if (!line.includes('class="text-blue-600 font-medium underline"')) {
        // 마크다운 링크 변환 (예: [출처](http://example.com))
        line = line.replace(markdownLinkPattern, (match, text, url) => {
          const normalizedUrl = normalizeUrl(url);
          return `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline break-all">${text}</a>`;
        });
        
        // 일반 URL 변환 (http://로 시작하는 URL)
        line = line.replace(urlPattern, (match) => {
          const normalizedUrl = normalizeUrl(match);
          return `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline break-all">${normalizedUrl}</a>`;
        });
      }
      
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
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              <div
                className={`p-3 ${
                  msg.sender === 'user'
                    ? 'bg-[#E4FFA9] self-end rounded-[15px] rounded-tr-[0px] flex justify-end text-[24px] max-w-xs w-fit'
                    : 'bg-[#F7FFE5] self-start rounded-[15px] rounded-tl-[0px] text-[18px] max-w-[85%] w-fit shadow-sm overflow-hidden break-words'
                }`}
              >
                {msg.sender === 'user' ? (
                  msg.text
                ) : (
                  <div 
                    dangerouslySetInnerHTML={formatText(msg.text)}
                    className="message-content"
                  />
                )}
              </div>
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