'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Calendar, ArrowRight, Heart, User, Clock, PlayCircle, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { PeoplefirstNeat } from '../fonts';

const MainPage = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [animateCharacter, setAnimateCharacter] = useState(false);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [bodyPartExercises, setBodyPartExercises] = useState<MuscleData[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<{[key: string]: boolean}>({});
  const [showAnimation, setShowAnimation] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // 캐릭터 애니메이션 토글
  const toggleCharacterAnimation = () => {
    setAnimateCharacter(true);
    // 1초 후 애니메이션 상태 초기화
    setTimeout(() => setAnimateCharacter(false), 1500);
  };
  
  // 운동 상세 정보 토글
  const toggleExerciseDetails = (muscleIndex: number, exerciseIndex: number) => {
    const key = `${muscleIndex}-${exerciseIndex}`;
    setExpandedExercises(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // 운동 상세 정보 확장 여부 확인
  const isExerciseExpanded = (muscleIndex: number, exerciseIndex: number) => {
    const key = `${muscleIndex}-${exerciseIndex}`;
    return expandedExercises[key] || false;
  };
  
  // 웰컴 화면 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
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
            // 세션 ID가 없으면 세션 ID도 설정
            if (!sessionId && data.session_id) {
              setSessionId(data.session_id);
            }
            // 로컬 스토리지에 사용자 정보 저장 (새로고침 대비)
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
    
    // 페이지 로드 시 사용자 정보 확인
    checkAuth();
    
    // 페이지 포커스 시 사용자 정보 다시 확인 (다른 탭에서 로그인/로그아웃 대응)
    const handleFocus = () => {
      checkAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [sessionId]);
  
  // 세션 생성 함수
  const createSession = async () => {
    try {
      setLoading(true);
      
      // 이미 로그인된 사용자인 경우 바로 onboarding으로 이동
      if (user) {
        console.log('로그인된 사용자입니다. onboarding 페이지로 이동합니다.');
        window.location.href = '/onboarding';
        return;
      }
      
      // 비로그인 사용자는 세션 생성 후 select 페이지로 이동
      const response = await fetch('/api/v1/sessions', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        console.log('Session created:', data.session_id);
        // 세션 생성 후 select 페이지로 이동
        window.location.href = '/select';
      } else {
        console.error('Failed to create session');
        alert('세션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('세션 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 근육 데이터 가져오기
  useEffect(() => {
    const fetchMuscles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/muscles');
        if (response.ok) {
          const data = await response.json();
          setMuscles(data.muscles || []);
        }
      } catch (error) {
        console.error('근육 데이터를 가져오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMuscles();
  }, []);
  
  // 선택된 부위의 운동 가져오기
  const fetchBodyPartExercises = async (bodyPart: string) => {
    try {
      setLoadingExercises(true);
      setBodyPartExercises([]);
      
      // 부위에 해당하는 근육들 찾기
      const categories = {
        'neck': ['흉쇄유돌근'],
        'shoulder': ['삼각근', '승모근'],
        'back': ['광배근', '승모근'],
        'arm': ['삼두근', '전완근', '단두', '장두'],
        'leg': ['대퇴직근', '내전근', '외측광근', '내측광근', '대둔근', '비복근', '반건양근', '전경골근', '봉공근'],
        'chest': ['대흉근', '복직근', '외복사근']
      };
      
      // 선택된 부위의 모든 근육에 대한 운동 가져오기
      const targetMuscles = categories[bodyPart as keyof typeof categories] || [];
      
      if (targetMuscles.length > 0) {
        // 모든 근육에 대한 API 요청을 병렬로 처리
        const exercisePromises = targetMuscles.map(async (muscle) => {
          try {
            const response = await fetch(`/api/v1/muscles/${muscle}/exercises`);
            if (response.ok) {
              const data = await response.json();
              // 근육 이름과 영어 이름을 함께 반환
              return {
                muscle: muscle,
                english: data.english || '',
                exercises: data.exercises || []
              };
            }
            return { muscle, english: '', exercises: [] };
          } catch (error) {
            console.error(`${muscle} 운동 데이터를 가져오는 중 오류 발생:`, error);
            return { muscle, english: '', exercises: [] };
          }
        });
        
        // 모든 API 요청 결과 기다리기
        const results = await Promise.all(exercisePromises);
        
        // 유효한 운동이 있는 결과만 필터링
        const validResults = results.filter(result => result.exercises.length > 0);
        
        setBodyPartExercises(validResults);
      }
    } catch (error) {
      console.error('운동 데이터를 가져오는 중 오류 발생:', error);
      setBodyPartExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  };
  
  // 부위 선택 처리
  const handleBodyPartClick = (partId: string) => {
    // 이미 선택된 부위를 다시 클릭하면 선택 해제
    if (selectedBodyPart === partId) {
      setSelectedBodyPart(null);
      setBodyPartExercises([]);
    } else {
      setSelectedBodyPart(partId);
      fetchBodyPartExercises(partId);
    }
  };
  
  // 추천 스트레칭 데이터
  const recommendedStretchings = [
    { 
      id: 1, 
      title: '아침 활력 스트레칭', 
      duration: '15분', 
      target: '전신',
      image: 'morning', 
      color: 'from-amber-400 to-orange-500',
      description: '하루를 활기차게 시작하는 전신 스트레칭 루틴으로 몸의 혈액순환을 촉진하고 에너지를 불어넣어 보세요.'
    },
    { 
      id: 2, 
      title: '목 & 어깨 릴랙스', 
      duration: '10분', 
      target: '상체',
      image: 'neck', 
      color: 'from-sky-400 to-blue-500',
      description: '장시간 컴퓨터 작업으로 인한 목과 어깨의 긴장을 완화하고 통증을 줄이는 집중 스트레칭입니다.'
    },
    { 
      id: 3, 
      title: '코어 강화 루틴', 
      duration: '12분', 
      target: '복부/등',
      image: 'core', 
      color: 'from-lime-400 to-green-500',
      description: '몸의 중심부를 강화하여 자세를 개선하고 일상 활동에서의 안정성을 높이는 스트레칭 시퀀스입니다.'
    }
  ];
  
  // 최근 스트레칭 데이터
  const recentStretchings = [
    { id: 1, title: '취침 전 릴랙스', time: '어제', duration: '8분' },
    { id: 2, title: '오전 활력 루틴', time: '2일 전', duration: '15분' },
    { id: 3, title: '하체 스트레칭', time: '3일 전', duration: '12분' }
  ];
  
  // 근육을 카테고리별로 분류 - 컴포넌트 외부로 이동하여 재사용 가능하게 함
  const muscleCategories = {
    '목': { id: 'neck', muscles: ['흉쇄유돌근'], color: 'bg-pink-100 text-pink-600' },
    '어깨': { id: 'shoulder', muscles: ['삼각근', '승모근'], color: 'bg-yellow-100 text-yellow-600' },
    '등/허리': { id: 'back', muscles: ['광배근', '승모근'], color: 'bg-blue-100 text-blue-600' },
    '팔/손목': { id: 'arm', muscles: ['삼두근', '전완근', '단두', '장두'], color: 'bg-purple-100 text-purple-600' },
    '다리': { id: 'leg', muscles: ['대퇴직근', '내전근', '외측광근', '내측광근', '대둔근', '비복근', '반건양근', '전경골근', '봉공근'], color: 'bg-green-100 text-green-600' },
    '가슴/복부': { id: 'chest', muscles: ['대흉근', '복직근', '외복사근'], color: 'bg-indigo-100 text-indigo-600' }
  };
  
  const getBodyParts = () => {
    if (loading || muscles.length === 0) {
      return [
        { id: 'neck', name: '목', count: 0, color: 'bg-pink-100 text-pink-600' },
        { id: 'shoulder', name: '어깨', count: 0, color: 'bg-yellow-100 text-yellow-600' },
        { id: 'back', name: '등/허리', count: 0, color: 'bg-blue-100 text-blue-600' },
        { id: 'arm', name: '팔/손목', count: 0, color: 'bg-purple-100 text-purple-600' },
        { id: 'leg', name: '다리', count: 0, color: 'bg-green-100 text-green-600' },
        { id: 'full', name: '전신', count: 0, color: 'bg-indigo-100 text-indigo-600' }
      ];
    }
    
    return Object.entries(muscleCategories).map(([name, data]) => {
      const count = data.muscles.filter(m => muscles.includes(m)).length;
      return {
        id: data.id,
        name,
        count,
        color: data.color,
        muscles: data.muscles // 근육 목록 추가
      };
    });
  };
  
  const bodyParts = getBodyParts();
  
  // 운동 데이터 타입 정의
  interface Exercise {
    title: string;
    abstract?: string;
    protocol?: {
      steps: string[];
    };
    evidence?: {
      url?: string;
      pmid?: string;
    };
    enhanced_metadata?: any;
    [key: string]: any;
  }
  
  interface MuscleData {
    muscle: string;
    english: string;
    exercises: Exercise[];
  }
  
  return (
    <div className="pb-20 max-w-md mx-auto bg-gray-50 min-h-screen">
      {/* 전체 콘텐츠를 감싸는 하얀색 박스 */}
      <div className="bg-white rounded-xl shadow-sm mx-2 my-3">
        {/* 헤더 영역 - 인터랙티브한 디자인으로 개선 */}
        <div className="bg-gradient-to-b from-[#F9FFEB] to-[#F3FADF] p-4 rounded-t-xl">
          {/* 로고와 캐릭터 영역 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <Image
                src="/assets/꾸부기로고.png"
                alt="꾸부기 로고"
                width={100}
                height={60}
                className="object-contain"
              />
            </div>
            
            {/* 꾸부기 캐릭터 - 더 많은 움직임 추가 */}
            <div 
              className={`w-16 h-16 transition-all duration-500 ${
                animateCharacter 
                  ? 'animate-tada' 
                  : 'animate-wiggle hover:scale-110'
              }`} 
              onClick={toggleCharacterAnimation}
            >
              <Image
                src="/assets/bugi.png"
                alt="꾸부기 캐릭터"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
          </div>
          
          {/* 인사말 영역 */}
          <div className="bg-white rounded-xl p-3 shadow-inner mt-2 transform transition-all duration-300 hover:shadow-md">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#E5FFA9] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <User className="w-5 h-5 text-[#6B925C]" />
              </div>
              <div>
                <h2 className={`${PeoplefirstNeat.className} text-lg font-bold text-[#6B925C]`}>
                  {user ? `안녕하세요 ${user.name} 님` : '안녕하세요'}
                </h2>
                <p className="text-sm text-gray-600">오늘도 건강한 하루 되세요!</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 메인 콘텐츠 */}
        <div className="px-4 py-6">
          {/* 시작하기 버튼 */}
          <div className="bg-gradient-to-r from-[#93D400] to-[#6B925C] rounded-xl p-5 mb-8 shadow-md transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h2 className="text-xl font-bold">지금 바로 시작하세요</h2>
                <p className="text-sm mt-1 opacity-90">맞춤형 스트레칭으로 건강한 하루를!</p>
              </div>
              <button 
                onClick={createSession}
                className="bg-white text-[#6B925C] px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#6B925C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </span>
                ) : (
                  <>
                    <span>{user ? '스트레칭 시작' : '시작하기'}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* 오늘의 추천 - 세로로 배치 변경 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center">
                <Heart className="w-5 h-5 mr-2 text-[#6B925C]" />
                오늘의 추천
              </h2>
            </div>
            
            <div className="space-y-4">
              {recommendedStretchings.slice(0, 3).map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-[#93D400] transform hover:translate-y-[-2px]"
                >
                  <div className={`h-16 bg-gradient-to-r ${item.color} flex items-center p-4`}>
                    <div className="text-white">
                      <h3 className="font-bold">{item.title}</h3>
                      <div className="flex items-center text-xs mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.duration}
                        <span className="mx-2">•</span>
                        <span>{item.target}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    <button className="mt-2 text-sm font-medium text-[#6B925C] flex items-center group">
                      자세히 보기 
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 부위별 스트레칭 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center">
                <Activity className="w-5 h-5 mr-2 text-[#6B925C]" />
                부위별 스트레칭
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bodyParts.map((part) => (
                <div 
                  key={part.id}
                  className={`${part.color} rounded-xl p-3 text-center cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-105 
                    ${selectedBodyPart === part.id ? 'ring-2 ring-[#6B925C] shadow-md' : ''}`}
                  onClick={() => handleBodyPartClick(part.id)}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center mb-2">
                      {/* 각 부위별 아이콘 추가 */}
                      {part.id === 'neck' && <span className="text-lg">👤</span>}
                      {part.id === 'shoulder' && <span className="text-lg">💪</span>}
                      {part.id === 'back' && <span className="text-lg">🔙</span>}
                      {part.id === 'arm' && <span className="text-lg">💪</span>}
                      {part.id === 'leg' && <span className="text-lg">🦵</span>}
                      {part.id === 'full' && <span className="text-lg">👤</span>}
                    </div>
                    <p className="font-medium">{part.name}</p>
                    <p className="text-xs mt-1">{part.count}개 운동</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 선택된 부위의 운동 목록 - 접기/펼치기 기능 제거 */}
            {selectedBodyPart && (
              <div className="mt-4 bg-white rounded-xl p-4 shadow-sm animate-fadeIn border border-gray-100">
                <h3 className="font-bold mb-3 flex items-center">
                  <span className="w-6 h-6 bg-[#E5FFA9] rounded-full flex items-center justify-center mr-2 text-xs text-[#6B925C]">
                    {Object.keys(muscleCategories).findIndex(key => muscleCategories[key as keyof typeof muscleCategories].id === selectedBodyPart) + 1}
                  </span>
                  {Object.keys(muscleCategories).find(key => muscleCategories[key as keyof typeof muscleCategories].id === selectedBodyPart)} 스트레칭
                </h3>
                
                {loadingExercises ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B925C]"></div>
                  </div>
                ) : bodyPartExercises.length > 0 ? (
                  <div className="space-y-4">
                    {bodyPartExercises.map((muscleData, muscleIndex) => (
                      <div key={muscleIndex} className="border rounded-lg p-3 hover:border-[#93D400] transition-colors">
                        <h4 className="font-medium text-[#6B925C] flex items-center">
                          <span className="w-5 h-5 bg-[#E5FFA9] rounded-full flex items-center justify-center mr-2 text-xs text-[#6B925C]">
                            {muscleIndex + 1}
                          </span>
                          {muscleData.muscle} ({muscleData.english})
                        </h4>
                        <div className="mt-2 space-y-3">
                          {muscleData.exercises.map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className="bg-gray-50 rounded-lg p-3 hover:bg-[#F9FFEB] transition-colors">
                              <div className="flex justify-between items-start">
                                <h5 className="font-medium">{exercise.title}</h5>
                              </div>
                              
                              {/* 항상 운동 상세 정보 표시 */}
                              <div className="mt-3 text-sm text-gray-600 animate-slideUp">
                                {exercise.abstract && (
                                  <p className="mb-2">{exercise.abstract}</p>
                                )}
                                
                                {exercise.protocol?.steps && (
                                  <div className="mt-3">
                                    <h6 className="font-medium text-[#6B925C] mb-1">수행 방법</h6>
                                    <ol className="list-decimal list-inside space-y-1">
                                      {exercise.protocol.steps.map((step, stepIndex) => (
                                        <li key={stepIndex} className="pl-1">{step}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">해당 부위의 운동 정보가 없습니다.</p>
                )}
              </div>
            )}
          </div>
          
          {/* 최근 활동 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#6B925C]" />
                최근 활동
              </h2>
              <Link href="/history" className="text-sm text-[#6B925C] flex items-center group">
                전체보기 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentStretchings.length > 0 ? (
                recentStretchings.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center border border-gray-100 hover:border-[#93D400] transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]"
                  >
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.time}
                        <span className="mx-1">•</span>
                        {item.duration}
                      </div>
                    </div>
                    <button className="text-[#6B925C] hover:scale-110 transition-transform p-2 rounded-full hover:bg-[#F9FFEB]">
                      <PlayCircle className="w-6 h-6" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm text-center border border-gray-100">
                  <div className="w-16 h-16 mx-auto mb-3 opacity-50">
                    <Image
                      src="/assets/bugi.png"
                      alt="부기 캐릭터"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <p className="text-gray-500 mb-3">아직 활동 기록이 없습니다.</p>
                  <button 
                    onClick={createSession}
                    className="bg-[#6B925C] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#5A7F4B] transition-colors flex items-center mx-auto"
                  >
                    <span>첫 스트레칭 시작하기</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 하단 네비게이션 */}
        <Fnb />
      </div>
    </div>
  );
};

export default MainPage; 