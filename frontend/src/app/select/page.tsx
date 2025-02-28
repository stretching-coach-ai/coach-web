'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { StardustBold } from '../fonts';
import { Stardust } from '../fonts';
import Link from 'next/link';

const select = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  //비회원로그인
  const handleGuestLoging = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/sessions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('세션생성 실패');
      }

      const data = await response.json();
      console.log('세션생성 성공:', data);
      router.push('/onboarding');
    } catch (error) {
      console.error('비회원 세션 생성 중 오류 발생:', error);
      alert('세션 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md flex flex-col items-center m-auto min-h-screen bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-sm mt-10">
        <div className="text-center mb-8">
          <Image
            src="/assets/꾸부기로고.png"
            alt="꾸부기 로고"
            width={150}
            height={90}
            className="mx-auto mb-4"
          />
          <h1 className={`${StardustBold.className} text-[#689700] text-[28px]`}>
            시작하기
          </h1>
          <p className="text-gray-600 mt-2">꾸부기와 함께 건강한 스트레칭을 시작해보세요</p>
        </div>
        
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 relative animate-bounce-slow">
            <Image
              src="/assets/bugi.png"
              alt="부기 캐릭터"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <p className={`${Stardust.className} text-xl border-b-[2px] border-b-[#93D400] ml-3`}>
            어떻게 시작할까부기?
          </p>
        </div>
        
        <div className={`${Stardust.className} space-y-4`}>
          <Button 
            variant="main" 
            size="main" 
            className="text-[18px] w-full flex items-center justify-center"
          >
            <Link className="w-full flex items-center justify-center" href="/auth/login">
              로그인
            </Link>
          </Button>
          
          <Button
            variant="main"
            size="main"
            className="text-[18px] w-full bg-[#E5FFA9] text-[#6B925C] hover:bg-[#d9ff8a] flex items-center justify-center"
            onClick={handleGuestLoging}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#6B925C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로딩중...
              </span>
            ) : (
              "비회원으로 시작하기"
            )}
          </Button>
          
          <Button
            variant="main"
            size="main"
            className="text-[18px] w-full bg-[#9EBC5A] text-white hover:bg-[#8aad49] flex items-center justify-center"
          >
            <Link className="w-full flex items-center justify-center" href="/signup">
              회원가입
            </Link>
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 text-center mt-8">
          회원가입 시 <Link href="/terms" className="text-[#6B925C] underline">이용약관</Link>과 <Link href="/privacy" className="text-[#6B925C] underline">개인정보 처리방침</Link>에 동의하게 됩니다.
        </p>
      </div>
    </main>
  );
};

export default select;
