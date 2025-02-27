'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartIcon } from 'hugeicons-react';
import { MoreHorizontalCircle01Icon } from 'hugeicons-react';
import { Home10Icon } from 'hugeicons-react';
import { AiChat02Icon } from 'hugeicons-react';

export const Fnb = () => {
  const pathname = usePathname();
  return (
    <footer className="w-full h-[63px] fixed bottom-0 left-0 right-0 z-40">
      <div className="w-full h-16 fixed bottom-0 left-0 right-0 bg-[#F9FFEB] rounded-t-[14px]">
        <div className="flex justify-between px-[43px] pt-[12px]">
          <Link
            href="/onboarding"
            className="flex flex-col text-[10px] font-medium text-[#6B925C] justify-center items-center"
            style={{ width: 'calc(100vw / 8.7)' }}
          >
            <Home10Icon
              className={`w-8 h-8 ${pathname === '/onboarding' ? 'text-[#6B925C]' : 'text-black'}`}
            />
            <p className="mt-[2px]">메인</p>
          </Link>
          <Link
            href="/chatting"
            className="flex flex-col text-[10px] font-medium text-[#6B925C] justify-center items-center"
            style={{ width: 'calc(100vw / 8.7)' }}
          >
            <AiChat02Icon
              className={`w-8 h-8 ${pathname === '/chatting' ? 'text-[#6B925C]' : 'text-black'}`}
            />
            <p className="mt-[2px]">채팅</p>
          </Link>
          <Link
            href="/"
            className="flex flex-col text-[10px] font-medium text-[#6B925C] justify-center items-center"
            style={{ width: 'calc(100vw / 8.7)' }}
          >
            <ChartIcon
              className={`w-8 h-8 ${pathname === '/' ? 'text-[#6B925C]' : 'text-black'}`}
            />
            <p className="mt-[2px]">기록</p>
          </Link>
          <Link
            href="/"
            className="flex flex-col text-[10px] font-medium text-[#6B925C] justify-center items-center"
            style={{ width: 'calc(100vw / 8.7)' }}
          >
            <MoreHorizontalCircle01Icon
              className={`w-8 h-8 ${pathname === '/' ? 'text-[#6B925C]' : 'text-black'}`}
            />
            <p className="mt-[2px]">더보기</p>
          </Link>
        </div>
      </div>
    </footer>
  );
};
