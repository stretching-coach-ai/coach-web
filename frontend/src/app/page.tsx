'use client';

import Image from 'next/image';
import { PeoplefirstNeat } from './fonts';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const WelcomePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // 로딩 후 자동으로 메인 페이지로 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      router.push('/main');
    }, 2000); // 2초 후 메인 페이지로 이동
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <main
      className={`${PeoplefirstNeat.className} overflow-hidden max-w-md flex flex-col items-center m-auto`}
    >
      <div className="w-full h-screen flex flex-col items-center justify-center">
        {/* 로고 */}
        <div className="w-[227px] h-[140px] mb-8 animate-bounce">
          <Image
            src="/assets/꾸부기로고.png"
            alt="logo"
            width={227}
            height={140}
          />
        </div>
        
        {/* 부기 캐릭터 - 회전 애니메이션 제거 */}
        <div className="relative w-[250px] h-[250px] mb-8">
          <div className="absolute inset-0">
            <Image
              src="/assets/bugi.png"
              alt="부기 캐릭터"
              width={250}
              height={250}
              className="object-contain"
            />
          </div>
        </div>
        
        {/* 로딩 텍스트 */}
        <div className="text-center mb-12">
          <p className="text-2xl font-bold text-[#6B925C] mb-2">스트레칭 준비 중...</p>
          <p className="text-lg text-gray-600">부기와 함께 건강한 하루를 시작해보세요!</p>
        </div>
        
        {/* 로딩 인디케이터 */}
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#93D400] to-[#6B925C] rounded-full transition-all duration-3000 ease-in-out"
            style={{ width: loading ? '30%' : '100%' }}
          ></div>
        </div>
      </div>
    </main>
  );
};

export default WelcomePage;
