'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { StardustBold, Stardust } from '../fonts';
import { ArrowLeft, Heart, Activity, Calendar, MessageCircle, Award } from 'lucide-react';

const AboutPage = () => {
  const router = useRouter();

  return (
    <main className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
      <div className="bg-white rounded-xl shadow-sm mx-2 my-3 p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="mr-3 p-1"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className={`${StardustBold.className} text-[#689700] text-xl`}>꾸부기 소개</h1>
          </div>
          <div className="w-10 h-10">
            <Image
              src="/assets/bugi.png"
              alt="부기 캐릭터"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
        
        {/* 로고 및 소개 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/꾸부기로고.png"
              alt="꾸부기 로고"
              width={150}
              height={90}
              className="object-contain"
            />
          </div>
          <h2 className={`${Stardust.className} text-xl text-[#6B925C] mb-2`}>
            당신의 건강한 일상을 위한 AI 스트레칭 코치
          </h2>
          <p className="text-gray-600">
            꾸부기는 개인 맞춤형 스트레칭 가이드를 제공하여 현대인의 건강한 생활을 돕는 서비스입니다.
          </p>
        </div>
        
        {/* 주요 기능 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-[#6B925C]" />
            주요 기능
          </h3>
          
          <div className="space-y-4">
            <div className="bg-[#F9FFEB] rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-[#E5FFA9] rounded-full p-2 mr-3 flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-[#6B925C]" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">AI 맞춤형 스트레칭</h4>
                  <p className="text-sm text-gray-600">
                    사용자의 신체 상태, 통증 부위, 생활 패턴 등을 분석하여 개인에게 최적화된 스트레칭 루틴을 제공합니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#F9FFEB] rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-[#E5FFA9] rounded-full p-2 mr-3 flex-shrink-0">
                  <Activity className="w-5 h-5 text-[#6B925C]" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">부위별 스트레칭 가이드</h4>
                  <p className="text-sm text-gray-600">
                    목, 어깨, 허리 등 다양한 신체 부위에 맞는 전문적인 스트레칭 방법을 상세히 안내합니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#F9FFEB] rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-[#E5FFA9] rounded-full p-2 mr-3 flex-shrink-0">
                  <Calendar className="w-5 h-5 text-[#6B925C]" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">활동 기록 및 관리</h4>
                  <p className="text-sm text-gray-600">
                    스트레칭 활동을 기록하고 관리하여 꾸준한 건강 관리를 돕습니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#F9FFEB] rounded-lg p-4">
              <div className="flex items-start">
                <div className="bg-[#E5FFA9] rounded-full p-2 mr-3 flex-shrink-0">
                  <Heart className="w-5 h-5 text-[#6B925C]" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">건강 정보 제공</h4>
                  <p className="text-sm text-gray-600">
                    올바른 자세와 스트레칭 방법에 대한 전문적인 정보를 제공하여 건강한 생활을 지원합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 서비스 비전 */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">서비스 비전</h3>
          <div className="bg-gray-50 rounded-lg p-5 text-center">
            <p className="text-gray-700 mb-3">
              꾸부기는 현대인의 바쁜 일상 속에서도 건강한 신체와 마음을 유지할 수 있도록 돕는 것을 목표로 합니다.
            </p>
            <p className="text-gray-700">
              AI 기술을 활용한 맞춤형 스트레칭 가이드를 통해 누구나 쉽고 효과적으로 건강을 관리할 수 있는 세상을 만들어 갑니다.
            </p>
          </div>
        </div>
        
        {/* 팀 소개 */}
        <div>
          <h3 className="text-lg font-bold mb-4">팀 소개</h3>
          <div className="bg-gray-50 rounded-lg p-5">
            <p className="text-gray-700 mb-3 text-center">
              ai spark camp 6 team
            </p>
            <div className="flex justify-center mt-4">
              <a 
                href="mailto:ruggy245@naver.com" 
                className="text-[#6B925C] hover:underline"
              >
                문의하기: ruggy245@naver.com
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* 하단 네비게이션 */}
      <Fnb />
    </main>
  );
};

export default AboutPage; 