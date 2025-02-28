'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { StardustBold } from '../fonts';
import { Stardust } from '../fonts';
import { useRef } from 'react';

const signup = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleEmailChange = (e: any) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e: any) => {
    setPassword(e.target.value);
  };

  const errorRef = useRef<HTMLDivElement>(null);
  const toggleVisibillity = (
    ref: React.RefObject<HTMLDivElement | null>,
    isVisible: boolean,
  ) => {
    if (ref.current) {
      ref.current.style.display = isVisible ? 'block' : 'none';
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) {
      alert('이메일, 비밀번호, 이름을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 요청 데이터 로깅
      const requestData = {
        email,
        password,
        name
      };
      console.log('회원가입 요청 데이터:', requestData);
      
      const response = await fetch(
        `${apiUrl}/api/v1/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        },
      );

      // 응답 상태 로깅
      console.log('응답 상태:', response.status, response.statusText);
      
      // 응답 본문 가져오기
      const responseText = await response.text();
      console.log('응답 본문 텍스트:', responseText);
      
      let result;
      try {
        // 텍스트가 비어있지 않은 경우에만 JSON 파싱 시도
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('응답 파싱 오류:', parseError);
        if (!response.ok) {
          toggleVisibillity(errorRef, true);
          throw new Error(`회원가입 실패: 상태 코드 ${response.status}`);
        }
      }

      if (!response.ok) {
        console.error('회원가입 실패:', result);
        toggleVisibillity(errorRef, true);
        throw new Error(
          `회원가입 실패: ${result?.detail || result?.message || '알 수 없는 오류'}`,
        );
      }

      console.log('회원가입 성공:', result);
      router.push('/auth/login');
    } catch (error) {
      console.error('오류 발생:', error);
      toggleVisibillity(errorRef, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-md flex flex-col items-start m-auto">
      <article className="mx-auto mt-9 flex flex-col justify-center items-center">
        <div
          className="w-full h-full absolute top-0"
          ref={errorRef}
          style={{ display: 'none' }}
          onClick={() => toggleVisibillity(errorRef, false)}
        >
          <div className="absolute top-0 bg-[#0000003b] w-full h-full"></div>
          <div
            className="absolute top-[30%] w-[278px] h-[185px] bg-[#323232] rounded-[25px] mx-auto my-auto"
            style={{ left: 'calc(50% - 139px)' }}
          >
            <div className="flex flex-col justify-center items-center">
              <div className="border-b-2 border-b-white mt-[57px] mb-[32px]">
                <p className="text-[20px] text-white">
                  회원가입에 실패했습니다!
                </p>
              </div>
              <div>
                <button
                  className="bg-white rounded-[6px] w-[174px] h-8"
                  onClick={() => toggleVisibillity(errorRef, false)}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className={`${StardustBold.className} text-[#689700] text-[32px]`}>
            회원가입
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
              좋은 선택이다부기!
            </p>
          </div>
        </div>
        <div className="bg-[#F9FFEB] px-3 py-6">
          <Textarea
            className="w-[339px] h-[63px] bg-white rounded-[10px] placeholder-[#9E9797]"
            placeholder="이메일"
            onChange={handleEmailChange}
          ></Textarea>
          <Textarea
            className="w-[339px] h-[63px] bg-white my-7 rounded-[10px] placeholder-[#9E9797]"
            placeholder="비밀번호"
            onChange={handlePasswordChange}
          ></Textarea>
          <Textarea
            className="w-[339px] h-[63px] bg-white rounded-[10px] placeholder-[#9E9797]"
            placeholder="이름"
            onChange={handleNameChange}
          ></Textarea>
        </div>
        <div className="mt-[159px]">
          <Button
            className={`${StardustBold.className} text-[18px]`}
            variant="main"
            size="main"
            onClick={handleSignup}
            disabled={isLoading}
          >
            회원가입하기
          </Button>
        </div>
      </article>
    </main>
  );
};

export default signup;
