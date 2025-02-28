'use client';

import { KkubugiChat } from '@/components/KkubugiChat';
import { Fnb } from '@/components/Fnb';
import { Gnb } from '@/components/Gnb';

export default function KkubugiPage() {
  return (
    <main className="flex flex-col min-h-screen bg-[#F9FFEB]">
      <Gnb />
      <div className="flex-1 pt-[72px] pb-[72px] bg-white">
        <KkubugiChat />
      </div>
      <Fnb />
    </main>
  );
} 