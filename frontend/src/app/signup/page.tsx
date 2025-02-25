'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Link from 'next/link';
import { StardustBold } from '../fonts';
import { Stardust } from '../fonts';

const signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isBtnEnabled, setIsBtnEnabled] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <main>
      <article className="mt-9 flex flex-col justify-center items-center">
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
          ></Textarea>
          <Textarea
            className="w-[339px] h-[63px] bg-white my-7 rounded-[10px] placeholder-[#9E9797]"
            placeholder="비밀번호"
          ></Textarea>
          <Textarea
            className="w-[339px] h-[63px] bg-white rounded-[10px] placeholder-[#9E9797]"
            placeholder="이름"
          ></Textarea>
        </div>
        <div className="mt-[159px]">
          <Button variant="main" size="main" className="text-[18px]">
            회원가입하기
          </Button>
        </div>
      </article>
    </main>
  );
};

export default signup;
