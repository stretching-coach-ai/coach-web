'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { BackgroundBase } from "@/components/BackgroundBase";

// 로딩 컴포넌트
function Loading() {
  return <div className="flex justify-center items-center h-screen">Loading...</div>;
}

// useSearchParams를 사용하는 컴포넌트를 dynamic import로 지연 로딩
const SessionsList = dynamic(() => import('./sessions-list'), {
  loading: () => <Loading />,
  ssr: false // 클라이언트 사이드에서만 렌더링
});

// 메인 페이지 컴포넌트
export default function HistoryPage() {
  return (
    <BackgroundBase>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">나의 스트레칭 기록</h1>
        
        <Suspense fallback={<Loading />}>
          <SessionsList />
        </Suspense>
      </div>
    </BackgroundBase>
  );
} 