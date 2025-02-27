'use client';

import { useState, useEffect, useRef } from 'react';
import { Stardust } from '../fonts';
import { Gnb } from '@/components/Gnb';
import { Fnb } from '@/components/Fnb';
import axios from 'axios';

export default function ChatUI() {
  const [messages, setMessages] = useState([
    { id: 1, text: '어떻게 아프냐부기?', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessionId = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/auth/me', {
        withCredentials: true,
      });
      console.log(response.data);
      return response.data.session_id; // 서버에서 session_id 반환해야 함
    } catch (error) {
      console.error('세션 ID를 가져오는 데 실패했습니다:', error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const session_id = await fetchSessionId(); // 백엔드에서 세션 ID 가져오기
    if (!session_id) {
      console.error('세션 ID를 찾을 수 없습니다.');
      return;
    }

    console.log('세션 ID:', session_id);

    const storedUserInfo = localStorage.getItem('userInfo');
    if (!storedUserInfo) {
      console.error('로컬스토리지에서 사용자 정보를 찾을 수 없습니다.');
      return;
    }

    const userInfo = JSON.parse(storedUserInfo);
    const payload = {
      age: parseInt(userInfo.age, 10),
      gender: userInfo.gender,
      lifestyle: {
        exercise_frequency: 0,
        sitting_hours: 10,
        sleep_hours: 7,
        work_hours: 0,
      },
      occupation: userInfo.job,
      pain_description: input,
      pain_level: 5, // 기본값 설정 (사용자 입력 받도록 변경 가능)
      selected_body_parts: userInfo.selected_body_parts,
    };

    try {
      const url = `http://localhost:8000/api/v1/${session_id}/stretching`;
      console.log('API 요청 URL:', url);

      const response = await axios.post(url, payload, {
        withCredentials: true,
      });
      console.log('API 응답:', response.data);

      const botReply = {
        id: messages.length + 2,
        text: response.data.message || '추천 스트레칭을 확인하세요.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botReply]);
    } catch (error: any) {
      console.error(
        'API 요청 실패:',
        error.response ? error.response.data : error.message,
      );
    }
  };

  return (
    <main className="max-w-md flex flex-col items-start m-auto">
      <Gnb />
      <div
        className="w-full flex flex-col h-screen p-5 mt-[72px]"
        style={{ height: 'calc(100vh - 126px)' }}
      >
        <div
          className={`${Stardust.className} flex-1 overflow-y-auto p-2 space-y-[42px]`}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              <div
                className={`p-3 max-w-xs w-fit ${msg.sender === 'user' ? 'bg-[#E4FFA9] self-end rounded-[15px] rounded-tr-[0px] flex justify-end text-[24px]' : 'bg-[#F7FFE5] self-start rounded-[15px] rounded-tl-[0px] text-[24px]'}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center p-3 pl-[35px] bg-[#E4FFA8] rounded-full text-[19px]">
          <input
            type="text"
            className="flex-1 focus:outline-none bg-transparent"
            placeholder="꾸부기에게 궁금한 거 물어보기"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
        </div>
        <p className="text-[10px] mx-auto mt-[9px]">
          꾸부기는 실수를 할 수 있습니다. 중요한 정보를 확인하세요.
        </p>
      </div>
      <Fnb />
    </main>
  );
}
