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
  const [currentMessage, setCurrentMessage] = useState(message || initialMessage);
  const [loadingTime, setLoadingTime] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [bounceDirection, setBounceDirection] = useState(1); // 1: 위로, -1: 아래로

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

  // 로딩 시간에 따라 진행 상태 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTime(prev => prev + 1);
      setLoadingProgress(prev => {
        // 처음에는 빠르게 증가하다가 나중에는 천천히 증가
        if (prev < 30) return prev + 5;
        if (prev < 60) return prev + 3;
        if (prev < 80) return prev + 1;
        if (prev < 95) return prev + 0.5;
        return 95; // 최대 95%까지만 (완료는 100%)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 캐릭터 바운스 애니메이션
  useEffect(() => {
    const bounceInterval = setInterval(() => {
      setBounceDirection(prev => prev * -1);
    }, 600);

    return () => clearInterval(bounceInterval);
  }, []);

  // message 속성이 변경될 때 currentMessage 업데이트
  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      // 메시지가 변경되면 로딩 시간과 진행 상태 초기화
      setLoadingTime(0);
      setLoadingProgress(10);
    }
  }, [message]);

  // 로딩 시간에 따라 메시지 변경 (message 속성이 없을 때만)
  useEffect(() => {
    if (!message) {
      if (loadingTime >= 2 && loadingTime < 5) {
        setCurrentMessage('분석중이다부기');
      } else if (loadingTime >= 5 && loadingTime < 8) {
        setCurrentMessage('맞춤 스트레칭을 찾고 있다부기');
      } else if (loadingTime >= 8) {
        setCurrentMessage('거의 다 왔다부기');
      }
    }
  }, [loadingTime, message]);

  // 초기 메시지가 변경되면 현재 메시지도 업데이트 (message 속성이 없을 때만)
  useEffect(() => {
    if (!message) {
      setCurrentMessage(initialMessage);
    }
  }, [initialMessage, message]);

  return (
    <div className="flex flex-col items-center justify-center w-full py-2">
      <div 
        className="relative w-12 h-12 mb-2"
        style={{
          transform: `translateY(${bounceDirection * 3}px)`,
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <Image
          src="/assets/bugi-head.png"
          alt="꾸부기"
          fill
          priority={true}
          sizes="(max-width: 768px) 100vw, 48px"
          className="object-contain"
        />
      </div>
      <p className="text-center text-[14px] text-[#6B925C] font-medium">
        {currentMessage}{dots}
      </p>
      <div className="w-full max-w-xs bg-[#D1F280] rounded-full h-2.5 mt-2 overflow-hidden">
        <div 
          className="bg-[#93D400] h-2.5 rounded-full" 
          style={{ 
            width: `${loadingProgress}%`,
            transition: 'width 0.8s ease-in-out',
            boxShadow: '0 0 8px rgba(147, 212, 0, 0.5)'
          }}
        ></div>
      </div>
      <div className="flex justify-center mt-1 space-x-1">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className={`w-1.5 h-1.5 rounded-full ${
              i === Math.floor(loadingTime % 3) 
                ? 'bg-[#93D400]' 
                : 'bg-[#D1F280]'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}; 