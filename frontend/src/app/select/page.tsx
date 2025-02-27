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
      const response = await fetch('http://localhost:8000/api/v1/sessions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('세션생성 실패');
      }

      const data = await response.json();
      console.log('세션생성 성공:', data);
      router.push('/onboarding');
    } catch (error) {
      console.error('비회원 세션 생성 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md flex flex-col items-start m-auto">
      <article className="mx-auto mt-9 flex flex-col justify-center items-center">
        <div>
          <p className={`${StardustBold.className} text-[#689700] text-[32px]`}>
            이거 뭐라고하지
          </p>
        </div>
        <div className="mt-[60px] text-[24px] w-[332px] h-[58px]">
          <div className="flex">
            <div className="overflow-hidden">
              <div>
                <Image
                  src="/assets/bugi.png"
                  alt="logo"
                  width={35}
                  height={55}
                ></Image>
              </div>
            </div>
            <p
              className={`${Stardust.className} border-b-[2px] border-b-[#93D400]`}
            >
              뭐냐부기
            </p>
          </div>
          <div className={`${Stardust.className} mt-[86px]`}>
            <Button variant="main" size="main" className="text-[18px]">
              <Link className="w-full" href="/auth/login">
                로그인
              </Link>
            </Button>
            <Button
              variant="main"
              size="main"
              className="text-[18px] my-9"
              onClick={handleGuestLoging}
              disabled={loading}
            >
              {loading ? '...로딩중' : '비로그인'}
            </Button>
            <Button
              variant="main"
              size="main"
              className="text-[18px] bg-[#9EBC5A] text-white"
            >
              <Link className="w-full" href="/signup">
                회원가입
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </main>
  );
};

export default select;
