'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { StardustBold, Stardust } from '../fonts';
import { ArrowLeft, User, Save, X } from 'lucide-react';

const ProfilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    occupation: '',
    lifestyle: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');

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
          if (data.is_authenticated && data.user) {
            setUser(data.user);
            
            // 사용자 프로필 정보 가져오기
            const profileResponse = await fetch('/api/v1/users/me/profile', {
              method: 'GET',
              credentials: 'include'
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setFormData({
                name: data.user.name || '',
                email: data.user.email || '',
                age: profileData.age?.toString() || '',
                gender: profileData.gender || '',
                occupation: profileData.occupation || '',
                lifestyle: profileData.lifestyle || ''
              });
            } else {
              // 프로필 정보가 없는 경우 기본 사용자 정보만 설정
              setFormData({
                name: data.user.name || '',
                email: data.user.email || '',
                age: '',
                gender: '',
                occupation: '',
                lifestyle: ''
              });
            }
          } else {
            // 로그인되지 않은 경우 메인 페이지로 리다이렉트
            router.push('/main');
          }
        } else {
          // 로그인되지 않은 경우 메인 페이지로 리다이렉트
          router.push('/main');
        }
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
        // 오류 발생 시 메인 페이지로 리다이렉트
        router.push('/main');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // 입력 필드 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // 성공 메시지 초기화
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    
    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) <= 0 || Number(formData.age) > 120)) {
      newErrors.age = '유효한 나이를 입력해주세요 (1-120)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 프로필 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // 프로필 업데이트 API 호출
      const response = await fetch('/api/v1/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          occupation: formData.occupation || null,
          lifestyle: formData.lifestyle || null
        })
      });
      
      if (response.ok) {
        setSuccessMessage('프로필이 성공적으로 업데이트되었습니다.');
        
        // 로컬 스토리지의 사용자 정보 업데이트
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.name = formData.name;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } else {
        const errorData = await response.json();
        setErrors({
          submit: errorData.detail || '프로필 업데이트에 실패했습니다.'
        });
      }
    } catch (error) {
      console.error('프로필 업데이트 중 오류 발생:', error);
      setErrors({
        submit: '프로필 업데이트 중 오류가 발생했습니다.'
      });
    } finally {
      setSaving(false);
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
            <h1 className={`${StardustBold.className} text-[#689700] text-xl`}>내 프로필</h1>
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
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6B925C]"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 프로필 이미지 */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#E5FFA9] rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-[#6B925C]" />
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
            
            {/* 오류 메시지 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                <p>{errors.submit}</p>
                <button 
                  type="button" 
                  onClick={() => setErrors(prev => ({ ...prev, submit: '' }))}
                  className="text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* 입력 필드 */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93D400]`}
                  placeholder="이름을 입력하세요"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  placeholder="이메일은 변경할 수 없습니다"
                />
              </div>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  나이
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.age ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93D400]`}
                  placeholder="나이를 입력하세요"
                  min="1"
                  max="120"
                />
                {errors.age && <p className="mt-1 text-sm text-red-500">{errors.age}</p>}
              </div>
              
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  성별
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93D400]"
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  직업
                </label>
                <input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93D400]"
                  placeholder="직업을 입력하세요"
                />
              </div>
              
              <div>
                <label htmlFor="lifestyle" className="block text-sm font-medium text-gray-700 mb-1">
                  생활 패턴
                </label>
                <textarea
                  id="lifestyle"
                  name="lifestyle"
                  value={formData.lifestyle}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93D400]"
                  placeholder="생활 패턴을 입력하세요 (예: 주 5일 근무, 하루 8시간 앉아서 일하고, 주 1회 운동, 하루 6시간 수면)"
                />
              </div>
            </div>
            
            {/* 저장 버튼 */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center py-3 px-4 bg-[#93D400] text-white rounded-lg hover:bg-[#84BF00] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    프로필 저장
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* 하단 네비게이션 */}
      <Fnb />
    </main>
  );
};

export default ProfilePage; 