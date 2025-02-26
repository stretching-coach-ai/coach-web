'use client';

import { useState, useEffect, useRef } from 'react';
import { Stardust } from '../fonts';
import { Gnb } from '@/components/Gnb';
import { Fnb } from '@/components/Fnb';

export default function ChatUI() {
  const [messages, setMessages] = useState([
    { id: 1, text: '어떻게 아프냐부기?', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
    };
    const botReply = { id: messages.length + 2, text: '답변', sender: 'bot' };
    setMessages([...messages, userMessage, botReply]);
    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <main className="max-w-md flex flex-col items-start m-auto">
      <Gnb></Gnb>
      <div
        className="w-full flex flex-col h-screen p-5 mt-[72px]"
        style={{ height: 'calc(100vh - 126px)' }}
      >
        {/* 채팅 메시지 영역 */}
        <div
          className={`${Stardust.className} flex-1 overflow-y-auto p-2 space-y-[42px]`}
        >
          {messages.map((msg) => (
            <div
              className={`flex ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              <div
                key={msg.id}
                className={`p-3 max-w-xs w-fit ${
                  msg.sender === 'user'
                    ? 'bg-[#E4FFA9] self-end rounded-[15px] rounded-tr-[0px] flex justify-end text-[24px]'
                    : 'bg-[#F7FFE5] self-start rounded-[15px] rounded-tl-[0px] text-[24px]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 */}
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
      <Fnb></Fnb>
    </main>
  );
}
