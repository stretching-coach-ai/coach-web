'use client';

import { useState, useEffect, useRef } from 'react';

export default function StreamingTestPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [painDescription, setPainDescription] = useState('장시간 컴퓨터 작업 후 목과 어깨가 뻐근하고 아픕니다.');
  const [selectedBodyParts, setSelectedBodyParts] = useState('목, 어깨');
  const [occupation, setOccupation] = useState('사무직');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [regularResponse, setRegularResponse] = useState('');
  
  const responseRef = useRef<HTMLDivElement>(null);

  // 세션 생성 함수
  const createSession = async () => {
    setSessionLoading(true);
    try {
      const response = await fetch('/api/v1/sessions', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        console.log('Session created:', data.session_id);
      } else {
        console.error('Failed to create session');
        alert('세션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('세션 생성 중 오류가 발생했습니다.');
    } finally {
      setSessionLoading(false);
    }
  };

  // 페이지 로드 시 자동으로 세션 생성
  useEffect(() => {
    createSession();
  }, []);

  // 일반 응답 요청
  const handleRegularSubmit = async () => {
    if (!sessionId) {
      alert('세션이 아직 생성되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setLoading(true);
    setRegularResponse('');
    
    try {
      console.log('요청 데이터:', {
        pain_description: painDescription,
        selected_body_parts: selectedBodyParts,
        occupation: occupation,
        age: 30,
        gender: '남성',
        lifestyle: '주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면',
        pain_level: 7,
      });
      
      const response = await fetch(`/api/v1/sessions/${sessionId}/stretching`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pain_description: painDescription,
          selected_body_parts: selectedBodyParts,
          occupation: occupation,
          age: 30,
          gender: '남성',
          lifestyle: '주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면',
          pain_level: 7,
        }),
        credentials: 'include',
      });
      
      console.log('응답 상태:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('응답 데이터:', data);
        setRegularResponse(data.text);
      } else {
        const errorText = await response.text();
        console.error('Failed to get response:', response.status, errorText);
        setRegularResponse(`오류가 발생했습니다. 상태 코드: ${response.status}\n\n${errorText}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setRegularResponse(`오류가 발생했습니다. ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // Helpy Pro 스트리밍 요청
  const handleHelpyProStreamingSubmit = async () => {
    if (!sessionId) {
      alert('세션이 아직 생성되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setLoading(true);
    setStreamingResponse('');
    
    try {
      console.log('Helpy Pro 스트리밍 요청 데이터:', {
        pain_description: painDescription,
        selected_body_parts: selectedBodyParts,
        occupation: occupation,
        age: 30,
        gender: '남성',
        lifestyle: '주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면',
        pain_level: 7,
      });
      
      // EventSource를 사용하여 SSE 연결
      const queryParams = new URLSearchParams({
        pain_description: painDescription,
        selected_body_parts: selectedBodyParts,
        occupation: occupation,
        age: '30',
        gender: '남성',
        lifestyle: '주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면',
        pain_level: '7',
      });
      
      const url = `/api/v1/sessions/${sessionId}/stretching/stream?${queryParams}`;
      console.log('SSE 연결 URL:', url);
      
      const eventSource = new EventSource(url);
      let chunkCount = 0;
      let fullResponse = '';
      let displayedLength = 0;
      const DISPLAY_INTERVAL = 50; // 50ms마다 화면 업데이트
      
      // 화면 업데이트 함수
      const updateDisplay = () => {
        if (displayedLength < fullResponse.length) {
          // 다음에 표시할 문자 수 계산 (최대 10자씩)
          const nextCharsCount = Math.min(10, fullResponse.length - displayedLength);
          displayedLength += nextCharsCount;
          
          // 현재까지 받은 응답 중 displayedLength만큼만 화면에 표시
          setStreamingResponse(fullResponse.substring(0, displayedLength));
          
          // 스크롤 자동 이동
          if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight;
          }
          
          // 아직 표시할 문자가 남아있으면 다음 업데이트 예약
          if (displayedLength < fullResponse.length) {
            setTimeout(updateDisplay, DISPLAY_INTERVAL);
          }
        }
      };
      
      eventSource.onopen = () => {
        console.log('Helpy Pro SSE 연결 성공');
      };
      
      eventSource.onmessage = (event) => {
        try {
          chunkCount++;
          console.log(`Helpy Pro SSE 메시지 #${chunkCount} 수신:`, event.data.length, '바이트');
          
          // 데이터 파싱
          const data = JSON.parse(event.data);
          console.log(`청크 #${chunkCount} 데이터:`, JSON.stringify(data).substring(0, 50) + '...');
          
          if (data.content) {
            // 전체 응답에 추가
            const prevLength = fullResponse.length;
            fullResponse += data.content;
            
            // 이전에 업데이트 중이 아니면 새로운 업데이트 시작
            if (displayedLength >= prevLength) {
              setTimeout(updateDisplay, DISPLAY_INTERVAL);
            }
          }
          
          // 스트리밍 완료 시 연결 종료
          if (data.done) {
            console.log(`Helpy Pro 스트리밍 완료: 총 ${chunkCount}개 청크 수신`);
            eventSource.close();
            
            // 남은 텍스트 모두 표시
            setTimeout(() => {
              if (displayedLength < fullResponse.length) {
                setStreamingResponse(fullResponse);
              }
              setLoading(false);
            }, 500); // 마지막 타이핑 효과가 끝난 후 로딩 상태 해제
          }
        } catch (error) {
          console.error('Error parsing Helpy Pro SSE data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('Helpy Pro SSE Error:', error);
        eventSource.close();
        setLoading(false);
        setStreamingResponse((prev) => prev + '\n\n연결 오류가 발생했습니다.');
      };
    } catch (error) {
      console.error('Error setting up Helpy Pro SSE:', error);
      setLoading(false);
      setStreamingResponse(`오류가 발생했습니다. ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // OpenAI 스트리밍 요청
  const handleOpenAIStreamingSubmit = async () => {
    if (!sessionId) {
      alert('세션이 아직 생성되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setLoading(true);
    setStreamingResponse('');
    
    try {
      console.log('OpenAI 스트리밍 요청 데이터:', {
        pain_description: painDescription,
        selected_body_parts: selectedBodyParts,
        occupation: occupation,
        age: 30,
        gender: '남성',
        lifestyle: '주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면',
        pain_level: 7,
      });
      
      // POST 요청으로 스트리밍 시작
      const response = await fetch(`/api/v1/sessions/${sessionId}/stretching/stream-openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pain_description: painDescription,
          selected_body_parts: selectedBodyParts,
          occupation: occupation,
          age: 30,
          gender: '남성',
          lifestyle: '주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면',
          pain_level: 7,
        }),
      });
      
      console.log('OpenAI 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`서버 오류: ${response.status} ${errorText}`);
      }
      
      // 응답을 읽기 위한 reader 생성
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      
      if (!reader) {
        throw new Error('Response body is null');
      }
      
      // 스트리밍 데이터 처리
      let chunkCount = 0;
      let buffer = '';
      let fullResponse = '';
      let displayedLength = 0;
      const DISPLAY_INTERVAL = 50; // 50ms마다 화면 업데이트
      
      // 화면 업데이트 함수
      const updateDisplay = () => {
        if (displayedLength < fullResponse.length) {
          // 다음에 표시할 문자 수 계산 (최대 10자씩)
          const nextCharsCount = Math.min(10, fullResponse.length - displayedLength);
          displayedLength += nextCharsCount;
          
          // 현재까지 받은 응답 중 displayedLength만큼만 화면에 표시
          setStreamingResponse(fullResponse.substring(0, displayedLength));
          
          // 스크롤 자동 이동
          if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight;
          }
          
          // 아직 표시할 문자가 남아있으면 다음 업데이트 예약
          if (displayedLength < fullResponse.length) {
            setTimeout(updateDisplay, DISPLAY_INTERVAL);
          }
        }
      };
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log(`스트리밍 완료: 총 ${chunkCount}개 청크 수신`);
          
          // 남은 텍스트 모두 표시
          if (displayedLength < fullResponse.length) {
            setStreamingResponse(fullResponse);
          }
          
          setLoading(false);
          break;
        }
        
        // 디코딩 및 파싱
        const text = decoder.decode(value, { stream: true });
        buffer += text;
        
        // 완전한 메시지 찾기
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // 마지막 불완전한 메시지는 버퍼에 유지
        
        for (const message of messages) {
          if (message.startsWith('data: ')) {
            try {
              chunkCount++;
              const jsonStr = message.substring(6);
              console.log(`청크 #${chunkCount} 수신:`, jsonStr.length, '바이트');
              
              const data = JSON.parse(jsonStr);
              
              if (data.content) {
                // 전체 응답에 추가
                const prevLength = fullResponse.length;
                fullResponse += data.content;
                
                // 이전에 업데이트 중이 아니면 새로운 업데이트 시작
                if (displayedLength >= prevLength) {
                  setTimeout(updateDisplay, DISPLAY_INTERVAL);
                }
              }
              
              // 스트리밍 완료 시
              if (data.done) {
                console.log('스트리밍 완료 신호 수신 (done: true)');
                // 로딩 상태는 모든 텍스트가 표시된 후 해제됨
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error, message);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in OpenAI streaming:', error);
      setLoading(false);
      setStreamingResponse(`오류가 발생했습니다. ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">스트리밍 API 테스트</h1>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <p className="mr-2">세션 ID: {sessionId || '로딩 중...'}</p>
          <button 
            onClick={createSession} 
            disabled={sessionLoading}
            className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 disabled:bg-gray-100"
          >
            {sessionLoading ? '발급 중...' : '새로 발급'}
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">통증 설명:</label>
          <textarea 
            value={painDescription}
            onChange={(e) => setPainDescription(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            rows={3}
          />
          
          <label className="block mb-1">신체 부위:</label>
          <input 
            type="text"
            value={selectedBodyParts}
            onChange={(e) => setSelectedBodyParts(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          
          <label className="block mb-1">직업:</label>
          <select 
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          >
            <option value="사무직">사무직</option>
            <option value="학생">학생</option>
            <option value="서비스업">서비스업</option>
            <option value="전문직">전문직</option>
            <option value="기타">기타</option>
          </select>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button 
            onClick={handleRegularSubmit} 
            disabled={loading || !sessionId}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            일반 요청 {loading && '로딩 중...'}
          </button>
          
          <button 
            onClick={handleHelpyProStreamingSubmit} 
            disabled={loading || !sessionId}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
          >
            Helpy Pro 스트리밍 {loading && '로딩 중...'}
          </button>
          
          <button 
            onClick={handleOpenAIStreamingSubmit} 
            disabled={loading || !sessionId}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
          >
            OpenAI 스트리밍 {loading && '로딩 중...'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-bold mb-2">일반 응답:</h2>
          <div className="border p-4 rounded bg-gray-50 h-[400px] overflow-auto whitespace-pre-wrap">
            {regularResponse || '응답이 여기에 표시됩니다...'}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold mb-2">스트리밍 응답:</h2>
          <div 
            ref={responseRef}
            className={`border p-4 rounded ${loading ? 'bg-gray-50 border-green-500 border-2' : 'bg-gray-50'} h-[400px] overflow-auto whitespace-pre-wrap`}
            style={{ 
              fontFamily: 'monospace',
              lineHeight: '1.6',
              fontSize: '14px',
              letterSpacing: '0.03em'
            }}
          >
            {loading && streamingResponse.length === 0 && (
              <div className="flex items-center text-gray-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                스트리밍 응답 대기 중...
              </div>
            )}
            <div className="typing-container">
              {streamingResponse || (!loading && '스트리밍 응답이 여기에 표시됩니다...')}
              {loading && streamingResponse.length > 0 && (
                <span className="inline-block animate-pulse text-green-500 ml-1">▌</span>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {loading && streamingResponse.length > 0 && '실시간 스트리밍 중...'}
          </div>
        </div>
      </div>
    </div>
  );
} 