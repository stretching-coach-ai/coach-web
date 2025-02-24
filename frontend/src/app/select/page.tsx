'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Link from 'next/link';
import { StardustBold } from '../fonts';
import { Stardust } from '../fonts';

const select = () => {
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
              로그인
            </Button>
            <Button variant="main" size="main" className="text-[18px] my-9">
              비로그인
            </Button>
            <Button
              variant="main"
              size="main"
              className="text-[18px] bg-[#9EBC5A] text-white"
            >
              회원가입
            </Button>
          </div>
        </div>
      </article>
    </main>
  );
};

export default select;
