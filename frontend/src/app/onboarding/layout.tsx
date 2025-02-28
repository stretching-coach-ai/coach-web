'use client';

import { Fnb } from '@/components/Fnb';
import { Gnb } from '@/components/Gnb';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md m-auto relative min-h-screen flex flex-col items-center justify-start bg-[#FAFFF2]">
      <Gnb></Gnb>
      <div className="w-full max-w-[390px] flex-1 flex flex-col items-center">
        {children}
      </div>
      <Fnb />
    </div>
  );
}
