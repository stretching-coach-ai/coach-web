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
    <footer className="max-w-md w-full h-[63px] fixed bottom-0 left-0 right-0 z-40 m-auto">
      <div className="max-w-md w-full h-16 fixed bottom-0 bg-[#F9FFEB] rounded-t-[14px]">
        <div className="flex justify-between px-[5%] sm:px-[43px] pt-[12px] max-w-[390px] mx-auto">
          <Link
            href="/"
            className="flex flex-col text-[10px] font-medium text-[#6B925C] justify-center items-center"
            style={{ width: 'calc(100% / 4.5)' }}
          >
            <Home10Icon
              className={`w-6 h-6 sm:w-8 sm:h-8 ${pathname === '/main' ? 'text-[#6B925C]' : 'text-black'}`}
            />
            <p className="mt-[2px]">메인</p>
          </Link>
          <Link
            href="/onboarding"
            className="flex flex-col text-[10px] font-medium text-[#6B925C] justify-center items-center"
            style={{ width: 'calc(100% / 4.5)' }}
          >
            <AiChat02Icon
              className={`w-6 h-6 sm:w-8 sm:h-8 ${
                ['/onboarding', '/chatting'].includes(pathname)
                  ? 'text-[#6B925C]'
                  : 'text-black'
              }`}
            />
            <p className="mt-[2px]">채팅</p>
          </Link>
          <Link
            href="/history"
            className="flex flex-col text-[10px] font-medium text-[#6B925C] justify-center items-center"
            style={{ width: 'calc(100% / 4.5)' }}
          >
            <ChartIcon
              className={`w-6 h-6 sm:w-8 sm:h-8 ${pathname === '/history' ? 'text-[#6B925C]' : 'text-black'}`}
            />
            <p className="mt-[2px]">기록</p>
          </Link>
          <Link
            href="/more"
            className="flex flex-col text-[10px] font-medium text-[#6B925C] justify-center items-center"
            style={{ width: 'calc(100% / 4.5)' }}
          >
            <MoreHorizontalCircle01Icon
              className={`w-6 h-6 sm:w-8 sm:h-8 ${pathname === '/more' ? 'text-[#6B925C]' : 'text-black'}`}
            />
            <p className="mt-[2px]">더보기</p>
          </Link>
        </div>
      </div>
    </footer>
  );
};
