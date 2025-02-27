'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { StardustBold, Stardust } from '../fonts';
import { LogOut, User, Settings, Info, Heart, Shield, HelpCircle, ChevronRight, FileText, Lock } from 'lucide-react';
import Link from 'next/link';

const MorePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
            'Pragma': 'no-cache'
          }
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
          console.error('사용자 정보를 가져오는데 실패했습니다:', response.status);
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

  // 회원탈퇴 처리
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }
    
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/v1/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        // 로컬 스토리지 완전 정리
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // 회원탈퇴 완료 알림
        alert('회원탈퇴가 완료되었습니다.');
        
        // 메인 페이지로 이동
        router.push('/main');
      } else {
        const errorData = await response.json();
        console.error('회원탈퇴 실패:', response.status, errorData);
        setPasswordError(errorData.detail || '회원탈퇴에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('회원탈퇴 중 오류 발생:', error);
      setPasswordError('회원탈퇴 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // 회원탈퇴 모달 열기
  const openDeleteConfirm = () => {
    setShowDeleteConfirm(true);
    setPassword('');
    setPasswordError('');
  };

  // 비밀번호 입력 후 회원탈퇴 진행
  const confirmDeleteWithPassword = () => {
    setShowDeleteConfirm(false);
    setShowPasswordModal(true);
  };

  return (
    <main className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
      <div className="bg-white rounded-xl shadow-sm mx-2 my-3 p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className={`${StardustBold.className} text-[#689700] text-2xl`}>더보기</h1>
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
                <h2 className={`${Stardust.className} text-lg font-bold`}>{user.name} 님</h2>
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
                  <h2 className={`${Stardust.className} text-lg font-bold`}>로그인이 필요합니다</h2>
                  <p className="text-sm text-gray-600">로그인하고 더 많은 기능을 이용해보세요</p>
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
          {/* 계정 관련 메뉴 */}
          <div className="border-b pb-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">계정</h3>
            <ul className="space-y-3">
              {user && (
                <li>
                  <Link 
                    href="/profile" 
                    className="w-full flex items-center justify-between py-2 px-1"
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-[#6B925C] mr-3" />
                      <span>내 프로필</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </li>
              )}
              <li>
                <Link 
                  href="/settings" 
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>설정</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </li>
              {user && (
                <li>
                  <button 
                    onClick={() => setShowLogoutConfirm(true)} 
                    className="w-full flex items-center justify-between py-2 px-1 text-left"
                  >
                    <div className="flex items-center">
                      <LogOut className="w-5 h-5 text-red-500 mr-3" />
                      <span className="text-red-500">로그아웃</span>
                    </div>
                  </button>
                </li>
              )}
            </ul>
          </div>
          
          {/* 서비스 정보 메뉴 */}
          <div className="border-b pb-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">서비스 정보</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/about" 
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <Info className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>꾸부기 소개</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>이용약관</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="w-full flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>개인정보 처리방침</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </li>
            </ul>
          </div>
          
          {/* 계정 관리 메뉴 */}
          {user && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">계정 관리</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={openDeleteConfirm} 
                    className="w-full flex items-center justify-between py-2 px-1 text-left"
                  >
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 text-red-500 mr-3" />
                      <span className="text-red-500">회원탈퇴</span>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
        
        {/* 로그아웃 확인 모달 */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-5 max-w-xs w-full mx-4">
              <h3 className="text-lg font-bold mb-3">로그아웃</h3>
              <p className="text-gray-600 mb-4">정말 로그아웃 하시겠습니까?</p>
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  취소
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 회원탈퇴 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-5 max-w-xs w-full mx-4">
              <h3 className="text-lg font-bold mb-3">회원탈퇴</h3>
              <p className="text-gray-600 mb-4">정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  취소
                </button>
                <button 
                  onClick={confirmDeleteWithPassword}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                >
                  계속하기
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 비밀번호 입력 모달 */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-5 max-w-xs w-full mx-4">
              <h3 className="text-lg font-bold mb-3">비밀번호 확인</h3>
              <p className="text-gray-600 mb-4">회원탈퇴를 위해 비밀번호를 입력해주세요.</p>
              
              <div className="mb-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="비밀번호"
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-red-500">{passwordError}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                  disabled={deleteLoading}
                >
                  취소
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      처리 중...
                    </>
                  ) : (
                    '탈퇴하기'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 하단 네비게이션 */}
      <Fnb />
    </main>
  );
};

export default MorePage; 