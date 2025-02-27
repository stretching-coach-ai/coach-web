'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { StardustBold, Stardust } from '../fonts';
import { ArrowLeft, Bell, Moon, Volume2, X, User, LogOut, Shield, AlertTriangle } from 'lucide-react';

const SettingsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    sound: true
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 설정 정보 가져오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        // 로컬 스토리지에서 설정 정보 가져오기
        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
        
        // 사용자 정보 가져오기
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
          console.log('사용자 정보 전체:', data);
          if (data.is_authenticated && data.user) {
            console.log('사용자 ID:', data.user.id);
            console.log('사용자 객체 타입:', typeof data.user);
            console.log('사용자 ID 타입:', typeof data.user.id);
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('설정 정보를 가져오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // 설정 변경 처리
  const handleToggle = (setting: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    
    setSettings(newSettings);
    
    // 로컬 스토리지에 설정 저장
    localStorage.setItem('settings', JSON.stringify(newSettings));
    
    // 성공 메시지 표시
    setSuccessMessage('설정이 저장되었습니다.');
    
    // 3초 후 성공 메시지 숨기기
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    
    // 서버에 설정을 저장하는 API가 있다면 여기에 추가
  };

  // 회원 탈퇴 처리
  const handleDeleteAccount = async () => {
    if (!password) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMessage('');

      if (!user) {
        setErrorMessage('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      // 사용자 정보 로깅 - 전체 객체 확인
      console.log('회원 탈퇴 시도 - 사용자 정보 전체:', JSON.stringify(user, null, 2));
      
      // 사용자 ID 확인
      let userId = user.id;
      console.log('회원 탈퇴 요청 - 사용자 ID 초기값:', userId);
      
      if (!userId) {
        console.error('사용자 ID가 없습니다:', user);
        setErrorMessage('사용자 ID를 찾을 수 없습니다.');
        return;
      }
      
      // 사용자 정보 다시 가져오기 - 최신 정보 확인
      try {
        const userResponse = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('사용자 정보 재확인:', userData);
          if (userData.is_authenticated && userData.user && userData.user.id) {
            userId = userData.user.id;
            console.log('사용자 ID 업데이트됨:', userId);
          } else {
            console.warn('사용자 인증 정보가 유효하지 않습니다:', userData);
          }
        } else {
          console.error('사용자 정보 조회 실패:', userResponse.status);
        }
      } catch (error) {
        console.error('사용자 정보 재확인 중 오류:', error);
      }
      
      console.log('회원 탈퇴 요청 - 사용자 ID 최종값:', userId);
      console.log('회원 탈퇴 요청 - 사용자 ID 타입:', typeof userId);
      
      // MongoDB ObjectId 형식 확인 (24자리 16진수)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(userId)) {
        console.error('유효하지 않은 MongoDB ObjectId 형식:', userId);
        setErrorMessage('유효하지 않은 사용자 ID 형식입니다. 다시 로그인 후 시도해주세요.');
        return;
      }
      
      // Next.js API 라우트를 통한 요청 - 리다이렉트 설정에 의해 백엔드로 전달됨
      const apiUrl = `/api/v1/users/${userId}`;
      console.log('API URL:', apiUrl);
      
      // 요청 본문 생성 - 백엔드 스키마에 맞게 password 필드만 전송
      const requestBody = { password };
      console.log('요청 본문:', requestBody);
      
      // 요청 옵션 설정
      const requestOptions: RequestInit = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      };
      console.log('요청 옵션:', requestOptions);
      
      // API 호출 - 디버깅을 위한 로그 추가
      console.log('API 호출 시작...');
      console.log('요청 본문 문자열:', JSON.stringify(requestBody));
      
      const response = await fetch(apiUrl, requestOptions);
      console.log('API 호출 완료');
      console.log('API 응답 상태:', response.status);
      console.log('API 응답 URL:', response.url);
      
      // 응답 헤더 로깅
      console.log('응답 헤더:');
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      
      const contentType = response.headers.get('content-type');
      console.log('응답 Content-Type:', contentType);
      
      if (response.ok) {
        // 로컬 스토리지 정리
        localStorage.removeItem('settings');
        
        // 성공 메시지 표시
        setSuccessMessage('회원 탈퇴가 완료되었습니다.');
        
        // 모달 닫기
        setShowDeleteModal(false);
        
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        let errorMessage = '회원 탈퇴 중 오류가 발생했습니다.';
        
        try {
          // 응답 본문 텍스트 확인
          const errorText = await response.text();
          console.error('회원 탈퇴 오류 응답 텍스트:', errorText);
          
          // JSON 파싱 시도
          if (errorText && errorText.trim() && (contentType?.includes('application/json') || errorText.startsWith('{'))) {
            try {
              const errorData = JSON.parse(errorText);
              console.error('회원 탈퇴 오류 응답 데이터:', errorData);
              errorMessage = errorData.detail || errorMessage;
            } catch (parseError) {
              console.error('JSON 파싱 오류:', parseError);
            }
          }
        } catch (e) {
          console.error('오류 응답을 읽을 수 없습니다:', e);
        }
        
        // 특정 오류 상태 코드에 따른 메시지 처리
        if (response.status === 403) {
          errorMessage = '본인 계정만 탈퇴할 수 있습니다.';
        } else if (response.status === 400) {
          errorMessage = '비밀번호가 올바르지 않습니다.';
        } else if (response.status === 404) {
          errorMessage = '사용자를 찾을 수 없습니다.';
        } else if (response.status === 422) {
          errorMessage = '요청 형식이 올바르지 않습니다. 다시 로그인 후 시도해주세요.';
        }
        
        setErrorMessage(errorMessage);
      }
    } catch (error) {
      console.error('회원 탈퇴 중 오류 발생:', error);
      setErrorMessage('회원 탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

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
            <h1 className={`${StardustBold.className} text-[#689700] text-xl`}>설정</h1>
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
        
        {/* 성공 메시지 */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <p>{successMessage}</p>
            <button 
              type="button" 
              onClick={() => setSuccessMessage('')}
              className="text-green-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <p>{errorMessage}</p>
            <button 
              type="button" 
              onClick={() => setErrorMessage('')}
              className="text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B925C]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 알림 설정 */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-medium mb-4">알림</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>푸시 알림</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.notifications}
                      onChange={() => handleToggle('notifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#93D400]"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-500 pl-8">스트레칭 알림 및 중요 업데이트를 받아보세요.</p>
              </div>
            </div>
            
            {/* 테마 설정 */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-medium mb-4">테마</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Moon className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>다크 모드</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.darkMode}
                      onChange={() => handleToggle('darkMode')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#93D400]"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-500 pl-8">어두운 테마로 눈의 피로를 줄이세요. (준비 중)</p>
              </div>
            </div>
            
            {/* 소리 설정 */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-medium mb-4">소리</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Volume2 className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>효과음</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.sound}
                      onChange={() => handleToggle('sound')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#93D400]"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-500 pl-8">앱 사용 중 효과음을 켜거나 끕니다. (준비 중)</p>
              </div>
            </div>
            
            {/* 개인정보 및 보안 */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-medium mb-4">개인정보 및 보안</h2>
              <div className="space-y-4">
                <button 
                  onClick={() => router.push('/profile')}
                  className="flex items-center justify-between w-full py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>프로필 관리</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-400 transform rotate-180" />
                </button>
                
                <button 
                  onClick={() => router.push('/privacy')}
                  className="flex items-center justify-between w-full py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>개인정보처리방침</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-400 transform rotate-180" />
                </button>
                
                <button 
                  onClick={() => router.push('/terms')}
                  className="flex items-center justify-between w-full py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-[#6B925C] mr-3" />
                    <span>이용약관</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-400 transform rotate-180" />
                </button>
              </div>
            </div>
            
            {/* 계정 관리 */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-medium mb-4">계정 관리</h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center justify-between w-full py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors text-red-500"
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>회원 탈퇴</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 transform rotate-180" />
                </button>
              </div>
            </div>
            
            {/* 앱 정보 */}
            <div>
              <h2 className="text-lg font-medium mb-4">앱 정보</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center mb-3">
                  <Image
                    src="/assets/꾸부기로고.png"
                    alt="꾸부기 로고"
                    width={100}
                    height={60}
                    className="object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">버전: 1.0.0</p>
                  <p className="text-sm text-gray-600 mt-1">© 2025 꾸부기. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">회원 탈퇴</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-5">
              <div className="bg-red-50 p-3 rounded-lg flex items-start mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  회원 탈퇴 시 모든 데이터가 삭제되며, 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                탈퇴를 진행하려면 비밀번호를 입력해주세요.
              </p>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93D400]"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
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
      
      {/* 하단 네비게이션 */}
      <Fnb />
    </main>
  );
};

export default SettingsPage; 