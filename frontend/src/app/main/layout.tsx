'use client';

import { Fnb } from '@/components/Fnb';

export default function MainLayout({
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