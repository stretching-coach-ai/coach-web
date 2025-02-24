'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

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
      <article>
        <section className="overflow-hidden h-full">
          <div className="flex h-full">
            <div>
              <p>회원가입</p>
            </div>
            <div>
              <div>
                <p>좋은 선택이다부기!</p>
              </div>
            </div>
            <div>
              <Button>이메일</Button>
              <Button>비밀번호</Button>
              <Button>이름</Button>
            </div>
          </div>
          <div></div>
        </section>
      </article>
    </main>
  );
};

export default signup;
