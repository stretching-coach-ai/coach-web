'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Gnb } from '@/components/Gnb';
import { Fnb } from '@/components/Fnb';
import { StardustBold, Stardust } from '../fonts';
import {
  LogOut,
  User,
  Settings,
  Info,
  Heart,
  Shield,
  HelpCircle,
} from 'lucide-react';

const MorePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 가져오기
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('사용자 정보 응답:', data);
          if (data.is_authenticated && data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            // 로컬 스토리지에서 사용자 정보 확인
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        } else {
          console.error(
            '사용자 정보를 가져오는데 실패했습니다:',
            response.status,
          );
          // 로컬 스토리지에서 사용자 정보 확인
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
        // 로컬 스토리지에서 사용자 정보 확인
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // 로컬 스토리지에서 사용자 정보 삭제
        localStorage.removeItem('user');
        // 로그아웃 후 메인 페이지로 이동
        router.push('/main');
      } else {
        console.error('로그아웃 실패:', response.status);
        alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <main className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
      <Gnb></Gnb>
      <div className="bg-white rounded-xl shadow-sm mx-2 mb-3 p-4">
        <div className="flex items-center justify-between mb-6 mt-[82px]">
          <h1 className={`${StardustBold.className} text-[#689700] text-2xl`}>
            더보기
          </h1>
          <div className="w-12 h-12">
            <Image
              src="/assets/bugi.png"
              alt="부기 캐릭터"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="bg-[#F9FFEB] rounded-xl p-4 mb-6">
          {user ? (
            <div className="flex items-center">
              <div className="w-12 h-12 bg-[#E5FFA9] rounded-full flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-[#6B925C]" />
              </div>
              <div>
                <h2 className={`${Stardust.className} text-lg font-bold`}>
                  {user.name} 님
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#E5FFA9] rounded-full flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-[#6B925C]" />
                </div>
                <div>
                  <h2 className={`${Stardust.className} text-lg font-bold`}>
                    로그인이 필요합니다
                  </h2>
                  <p className="text-sm text-gray-600">
                    로그인하고 더 많은 기능을 이용해보세요
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-[#93D400] text-white px-4 py-2 rounded-lg text-sm"
              >
                로그인
              </button>
            </div>
          )}
        </div>

        {/* 메뉴 목록 */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">계정</h3>
            <ul className="space-y-3">
              {user && (
                <li>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full flex items-center justify-between py-2 px-1"
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-[#6B925C] mr-3" />
                      <span className={`${Stardust.className}`}>내 프로필</span>
                    </div>
                    <span className="text-gray-400">›</span>
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span className={`${Stardust.className}`}>설정</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="border-b pb-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">정보</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => router.push('/about')}
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <Info className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span className={`${Stardust.className}`}>꾸부기 소개</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/terms')}
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span className={`${Stardust.className}`}>이용약관</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/privacy')}
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span className={`${Stardust.className}`}>
                      개인정보 처리방침
                    </span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="border-b pb-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">지원</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => router.push('/help')}
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span className={`${Stardust.className}`}>도움말</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 로그아웃 버튼 */}
          {user && (
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center py-3 px-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-5 h-5 text-red-500 mr-2" />
                <span className={`${Stardust.className} text-red-500`}>
                  로그아웃
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <Fnb />
    </main>
  );
};

export default MorePage;
