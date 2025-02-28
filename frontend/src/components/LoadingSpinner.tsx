'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  initialMessage?: string;
}

export const LoadingSpinner = ({ 
  message = '응답을 생성하고 있다부기...',
  initialMessage = '꾸부기가 스트레칭을 찾고 있다부기'
}: LoadingSpinnerProps) => {
  const [dots, setDots] = useState('');
  const [currentMessage, setCurrentMessage] = useState(initialMessage);
  const [loadingTime, setLoadingTime] = useState(0);

  // 로딩 애니메이션을 위한 점 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // 로딩 시간에 따라 메시지 변경
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 로딩 시간에 따라 메시지 변경
  useEffect(() => {
    if (loadingTime >= 2 && loadingTime < 5) {
      setCurrentMessage('분석중이다부기');
    } else if (loadingTime >= 5 && loadingTime < 8) {
      setCurrentMessage('맞춤 스트레칭을 찾고 있다부기');
    } else if (loadingTime >= 8) {
      setCurrentMessage('거의 다 왔다부기');
    }
  }, [loadingTime]);

  return (
    <div className="flex flex-col items-center justify-center w-full py-4">
      <div className="relative w-16 h-16 mb-3 animate-bounce">
        <Image
          src="/assets/bugi-head.png"
          alt="꾸부기"
          fill
          sizes="(max-width: 768px) 100vw, 64px"
          className="object-contain"
        />
      </div>
      <p className="text-center text-[16px] text-green-800 font-medium">
        {currentMessage}{dots}
      </p>
      <div className="w-full max-w-xs bg-[#D1F280] rounded-full h-2 mt-3">
        <div 
          className="bg-[#9ACD32] h-2 rounded-full animate-pulse" 
          style={{ 
            width: `${Math.min(70 + loadingTime * 3, 95)}%`,
            transition: 'width 0.5s ease-in-out'
          }}
        ></div>
      </div>
    </div>
  );
}; 