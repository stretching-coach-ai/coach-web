'use client';

import { Fnb } from '@/components/Fnb';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-[#FAFFF2]">
      <div className="w-full max-w-[390px] flex-1 flex flex-col items-center">
        {children}
      </div>
      <Fnb />
    </div>
  );
} 