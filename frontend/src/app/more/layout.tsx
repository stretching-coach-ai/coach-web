'use client';

import { Fnb } from '@/components/Fnb';
import { Gnb } from '@/components/Gnb';

export default function MoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {children}
      <Fnb />
    </div>
  );
}
