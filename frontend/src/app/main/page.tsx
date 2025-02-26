'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Calendar, ArrowRight, Heart, User, Search, TrendingUp, Award, Clock, PlayCircle, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { PeoplefirstNeat } from '../fonts';

const MainPage = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [animateCharacter, setAnimateCharacter] = useState(false);
  const [streakCount, setStreakCount] = useState(5);
  const [muscles, setMuscles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [bodyPartExercises, setBodyPartExercises] = useState<MuscleData[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<{[key: string]: boolean}>({});
  const [showAnimation, setShowAnimation] = useState(true);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 캐릭터 애니메이션 토글
  const toggleCharacterAnimation = () => {
    setAnimateCharacter(true);
    setTimeout(() => setAnimateCharacter(false), 1000);
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
  
  // 검색 기능 처리
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(`/api/v1/muscles/${searchQuery}/exercises`);
      if (response.ok) {
        const data = await response.json();
        setBodyPartExercises([data]); // 배열로 설정
        setSelectedBodyPart(data.muscle);
      } else {
        console.error('검색 결과를 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    }
  };

  // 검색 입력 시 엔터 키 처리
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className={`${PeoplefirstNeat.className} relative flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto`}>
      {/* 웰컴 스플래시 */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#6B925C] to-[#9EB384]">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-bounce">
              <Image
                src="/assets/꾸부기로고.png"
                alt="logo"
                width={70}
                height={70}
                className="w-16 h-16 sm:w-20 sm:h-20"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">오늘도 건강한 하루!</h1>
          </div>
        </div>
      )}
      
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white shadow-sm px-3 sm:px-5 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#6B925C] to-[#9EB384] bg-clip-text text-transparent">꾸부기</span>
          </div>
          <div className="flex space-x-2 items-center">
            {showSearchInput ? (
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <input
                  type="text"
                  placeholder="근육 이름 검색"
                  className="bg-transparent border-none outline-none text-sm w-32 sm:w-40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                <button onClick={handleSearch} className="ml-1">
                  <Search size={16} className="text-gray-500" />
                </button>
                <button 
                  onClick={() => setShowSearchInput(false)} 
                  className="ml-1 text-gray-500 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={() => setShowSearchInput(true)}
              >
                <Search size={16} className="text-gray-500 sm:w-5 sm:h-5" />
              </button>
            )}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#6B925C] to-[#9EB384] flex items-center justify-center text-white font-medium text-sm">
              JK
            </div>
          </div>
        </div>
      </header>
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 px-3 sm:px-5 py-3 sm:py-4 pb-20 overflow-auto">
        {/* 환영 메시지 및 캐릭터 */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-[#F9FFEB] to-[#F9FFEB] p-3 sm:p-4 flex items-center justify-between">
            <div className="w-3/5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">안녕하세요, 쿠키님!</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">오늘도 꾸준한 스트레칭으로 건강한 하루를 시작해보세요.</p>
              
              <div className="mt-2 sm:mt-3 flex items-center space-x-2 sm:space-x-3">
                <div className="bg-white rounded-full px-2 sm:px-3 py-0.5 sm:py-1 flex items-center text-xs sm:text-sm shadow-sm">
                  <Award size={14} className="text-amber-500 mr-1" />
                  <span className="font-medium">{streakCount}일 연속</span>
                </div>
                
                <Link 
                  href="/chating"
                  className="bg-gradient-to-r from-[#6B925C] to-[#9EB384] text-white rounded-full px-3 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm font-medium flex items-center shadow-sm"
                >
                  시작하기
                  <ArrowRight size={12} className="ml-1" />
                </Link>
              </div>
            </div>
            
            <div 
              className="relative w-16 h-16 sm:w-24 sm:h-24 cursor-pointer"
              onClick={toggleCharacterAnimation}
            >
              <div className={`absolute inset-0 w-full h-full bg-[#F9FFEB] rounded-full flex items-center justify-center transition-transform duration-300 ${animateCharacter ? 'scale-110' : ''}`}>
                <Image
                  src="/assets/bugi.png"
                  alt="꾸부기"
                  width={60}
                  height={60}
                  className="w-12 h-12 sm:w-20 sm:h-20"
                />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-md ${animateCharacter ? 'animate-bounce' : ''}`}>
                GO!
              </div>
            </div>
          </div>
          
          {/* 퀵 링크 */}
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
            {[
              { icon: <Calendar size={16} className="sm:w-5 sm:h-5" />, label: '루틴', href: '/onboarding' },
              { icon: <Activity size={16} className="sm:w-5 sm:h-5" />, label: '통계', href: '/' },
              { icon: <Heart size={16} className="sm:w-5 sm:h-5" />, label: '좋아요', href: '/' },
              { icon: <User size={16} className="sm:w-5 sm:h-5" />, label: '프로필', href: '/' }
            ].map((item, idx) => (
              <Link 
                key={idx} 
                href={item.href}
                className="flex flex-col items-center justify-center py-2 sm:py-3 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {item.icon}
                <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* 오늘의 추천 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">오늘의 추천</h2>
            <button className="text-xs sm:text-sm text-[#6B925C] font-medium">더보기</button>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {recommendedStretchings.map((item) => (
              <div 
                key={item.id}
                className={`bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${expandedCard === item.id ? 'mb-3 sm:mb-4' : ''}`}
                onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
              >
                <div className={`bg-gradient-to-r ${item.color} p-3 sm:p-4 flex justify-between items-center`}>
                  <div className="text-white">
                    <h3 className="text-sm sm:text-base font-semibold">{item.title}</h3>
                    <div className="flex items-center mt-0.5 sm:mt-1 text-xs sm:text-sm opacity-90">
                      <Clock size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                      {item.duration}
                      <span className="mx-1.5 sm:mx-2">•</span>
                      <span>{item.target}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/20 rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center text-white">
                    <PlayCircle size={20} className="sm:w-6 sm:h-6" />
                  </div>
                </div>
                
                {expandedCard === item.id && (
                  <div className="p-3 sm:p-4 animate-fadeIn">
                    <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3">
                      {item.description}
                    </p>
                    <Link
                      href="/chating"
                      className="w-full py-1.5 sm:py-2 bg-gradient-to-r from-[#6B925C] to-[#9EB384] text-white rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center"
                    >
                      지금 시작하기
                      <ArrowRight size={12} className="ml-1 sm:w-3.5 sm:h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* 신체 부위별 스트레칭 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">부위별 스트레칭</h2>
            <button className="text-xs sm:text-sm text-[#6B925C] font-medium">전체보기</button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {bodyParts.map((part) => (
              <div 
                key={part.id} 
                className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md transition-all duration-200 ${selectedBodyPart === part.id ? 'ring-2 ring-[#6B925C] scale-105' : ''}`}
                onClick={() => handleBodyPartClick(part.id)}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${part.color} rounded-full flex items-center justify-center mb-1 sm:mb-1.5 transition-transform duration-200 ${selectedBodyPart === part.id ? 'scale-110' : ''}`}>
                  <span className="font-semibold text-sm sm:text-base">{part.count}</span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">{part.name}</span>
                {/* 세부 근육 이름 표시 */}
                <div className="mt-0.5 text-[8px] sm:text-[9px] text-gray-500 leading-tight max-w-full px-1 overflow-hidden text-ellipsis">
                  {(() => {
                    // 해당 부위의 근육 목록 찾기
                    const muscleList = Object.entries(muscleCategories).find(([name]) => name === part.name)?.[1]?.muscles || [];
                    
                    // 최대 3개까지만 표시
                    return muscleList.slice(0, 3).join(', ') + (muscleList.length > 3 ? ' 외' : '');
                  })()}
                </div>
              </div>
            ))}
          </div>
          
          {/* 선택된 부위의 운동 목록 */}
          {selectedBodyPart && (
            <div className="mt-3 sm:mt-4 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm animate-fadeIn">
              <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
                {bodyParts.find(part => part.id === selectedBodyPart)?.name} 스트레칭
              </h3>
              
              {loadingExercises ? (
                <div className="flex justify-center items-center py-4">
                  <div className="w-5 h-5 border-2 border-[#6B925C] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-500">로딩 중...</span>
                </div>
              ) : bodyPartExercises.length > 0 ? (
                <div className="space-y-4 sm:space-y-5">
                  {bodyPartExercises.map((muscleData, muscleIndex) => (
                    <div key={muscleIndex} className="border-t pt-3 first:border-t-0 first:pt-0">
                      <h4 className="text-sm sm:text-base font-medium text-gray-800 mb-2">
                        {muscleData.muscle}
                        {muscleData.english && <span className="text-xs sm:text-sm text-gray-500 ml-1">({muscleData.english})</span>}
                      </h4>
                      
                      <ul className="space-y-2 sm:space-y-3">
                        {muscleData.exercises.map((exercise: Exercise, idx: number) => (
                          <li 
                            key={idx} 
                            className="flex items-start p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => toggleExerciseDetails(muscleIndex, idx)}
                          >
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#F9FFEB] rounded-full flex items-center justify-center text-[#6B925C] mr-2 sm:mr-3 mt-0.5">
                              <span className="font-semibold text-xs sm:text-sm">{idx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <h5 className="text-sm sm:text-base font-medium text-gray-800">
                                  {exercise.한글_제목 || `${muscleData.muscle} 스트레칭 ${idx + 1}`}
                                </h5>
                                <button className="text-gray-400 hover:text-[#6B925C]">
                                  {isExerciseExpanded(muscleIndex, idx) ? 
                                    <ChevronUp size={16} /> : 
                                    <ChevronDown size={16} />
                                  }
                                </button>
                              </div>
                              
                              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                                {exercise.간략_설명 || `${muscleData.muscle}의 유연성을 높이고 통증을 완화하는 스트레칭입니다.`}
                              </p>
                              
                              {!isExerciseExpanded(muscleIndex, idx) && exercise.태그 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {exercise.태그.slice(0, 3).map((tag: string, tagIdx: number) => (
                                    <span key={tagIdx} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {/* 관련 자료 링크 (축소된 상태) */}
                              {!isExerciseExpanded(muscleIndex, idx) && exercise.관련_자료 && (
                                <div className="mt-1 sm:mt-2 flex items-center">
                                  {exercise.관련_자료.url && (
                                    <a 
                                      href={exercise.관련_자료.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs sm:text-sm text-[#6B925C] font-medium"
                                      onClick={(e) => e.stopPropagation()} // 버블링 방지
                                    >
                                      <PlayCircle size={14} className="mr-1" />
                                      관련 자료 보기
                                    </a>
                                  )}
                                  {exercise.관련_자료.pubmed_url && !exercise.관련_자료.url && (
                                    <a 
                                      href={exercise.관련_자료.pubmed_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs sm:text-sm text-blue-600 font-medium ml-3"
                                      onClick={(e) => e.stopPropagation()} // 버블링 방지
                                    >
                                      <Search size={14} className="mr-1" />
                                      PubMed
                                    </a>
                                  )}
                                </div>
                              )}
                              
                              {isExerciseExpanded(muscleIndex, idx) && (
                                <div className="mt-2 sm:mt-3 space-y-2 animate-fadeIn">
                                  {/* 스트레칭 방법 */}
                                  {exercise.스트레칭_방법 && (
                                    <div className="bg-[#F9FFEB] p-2 rounded-lg">
                                      <p className="text-xs sm:text-sm font-medium text-[#6B925C]">스트레칭 방법</p>
                                      {exercise.스트레칭_방법.시작_자세 && (
                                        <p className="text-xs text-gray-700 mt-1">
                                          <span className="font-medium">시작 자세:</span> {exercise.스트레칭_방법.시작_자세}
                                        </p>
                                      )}
                                      
                                      {/* 동작 단계 */}
                                      {exercise.스트레칭_방법.동작_단계 && (
                                        <div className="mt-1">
                                          <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                                            {exercise.스트레칭_방법.동작_단계.map((step: string, stepIdx: number) => (
                                              <li key={stepIdx}>{step}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      {/* 호흡법 */}
                                      {exercise.스트레칭_방법.호흡_방법 && (
                                        <p className="text-xs text-gray-700 mt-1">
                                          <span className="font-medium">호흡법:</span> {exercise.스트레칭_방법.호흡_방법}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* 효과 및 적용 */}
                                  {exercise.효과_및_적용?.주요_효과 && (
                                    <div className="bg-blue-50 p-2 rounded-lg">
                                      <p className="text-xs sm:text-sm font-medium text-blue-600">효과 및 적용</p>
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {exercise.효과_및_적용.주요_효과.map((effect: string, effectIdx: number) => (
                                          <span key={effectIdx} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                            {effect}
                                          </span>
                                        ))}
                                      </div>
                                      
                                      {exercise.효과_및_적용.적용_대상 && (
                                        <p className="text-xs text-gray-700 mt-1">
                                          <span className="font-medium">추천 대상:</span> {exercise.효과_및_적용.적용_대상}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* 안전 및 주의사항 */}
                                  {exercise.안전_및_주의사항 && (
                                    <div className="bg-amber-50 p-2 rounded-lg">
                                      <p className="text-xs sm:text-sm font-medium text-amber-600">주의사항</p>
                                      {exercise.안전_및_주의사항.수행_시_주의점 && (
                                        <ul className="text-xs text-gray-700 mt-1 space-y-0.5 list-disc list-inside">
                                          {exercise.안전_및_주의사항.수행_시_주의점.map((caution: string, cautionIdx: number) => (
                                            <li key={cautionIdx}>{caution}</li>
                                          ))}
                                        </ul>
                                      )}
                                      
                                      {/* 금기 사항 추가 */}
                                      {exercise.안전_및_주의사항.금기사항 && (
                                        <div className="mt-1">
                                          <p className="text-xs font-medium text-red-600">다음 경우 피해주세요:</p>
                                          <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                                            {exercise.안전_및_주의사항.금기사항.map((contraindication: string, idx: number) => (
                                              <li key={idx}>{contraindication}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* 추천 시간 및 빈도 */}
                                  {exercise.추천_시간_및_빈도 && (
                                    <div className="bg-green-50 p-2 rounded-lg">
                                      <p className="text-xs sm:text-sm font-medium text-green-600">추천 시간 및 빈도</p>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {exercise.추천_시간_및_빈도.유지_시간 && (
                                          <div className="flex items-center">
                                            <Clock size={12} className="text-green-600 mr-1" />
                                            <span className="text-xs">{exercise.추천_시간_및_빈도.유지_시간}</span>
                                          </div>
                                        )}
                                        {exercise.추천_시간_및_빈도.반복_횟수 && (
                                          <div className="flex items-center">
                                            <TrendingUp size={12} className="text-green-600 mr-1" />
                                            <span className="text-xs">{exercise.추천_시간_및_빈도.반복_횟수}</span>
                                          </div>
                                        )}
                                        {exercise.추천_시간_및_빈도.주간_빈도 && (
                                          <div className="flex items-center">
                                            <Calendar size={12} className="text-green-600 mr-1" />
                                            <span className="text-xs">{exercise.추천_시간_및_빈도.주간_빈도}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* 관련 자료 링크 (확장된 상태) */}
                                  {isExerciseExpanded(muscleIndex, idx) && exercise.관련_자료 && (
                                    <div className="bg-gray-50 p-2 rounded-lg">
                                      <p className="text-xs sm:text-sm font-medium text-gray-600">관련 자료</p>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {exercise.관련_자료.url && (
                                          <a 
                                            href={exercise.관련_자료.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs sm:text-sm text-[#6B925C] font-medium"
                                            onClick={(e) => e.stopPropagation()} // 버블링 방지
                                          >
                                            <PlayCircle size={14} className="mr-1" />
                                            관련 자료 보기
                                          </a>
                                        )}
                                        {exercise.관련_자료.pubmed_url && !exercise.관련_자료.url && (
                                          <a 
                                            href={exercise.관련_자료.pubmed_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs sm:text-sm text-blue-600 font-medium"
                                            onClick={(e) => e.stopPropagation()} // 버블링 방지
                                          >
                                            <Search size={14} className="mr-1" />
                                            PubMed
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* 이 운동으로 시작하기 버튼 */}
                                  <div className="mt-3">
                                    <Link
                                      href={`/chating?muscle=${encodeURIComponent(muscleData.muscle)}&exercise=${encodeURIComponent(exercise.title)}`}
                                      className="w-full py-1.5 bg-gradient-to-r from-[#6B925C] to-[#9EB384] text-white rounded-lg font-medium text-xs flex items-center justify-center"
                                      onClick={(e) => e.stopPropagation()} // 버블링 방지
                                    >
                                      이 운동으로 시작하기
                                      <ArrowRight size={12} className="ml-1" />
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">이 부위에 대한 운동이 없습니다.</p>
                </div>
              )}
              
              <div className="flex space-x-2 sm:space-x-3 mt-3 sm:mt-4">
                <button 
                  className="flex-1 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center"
                  onClick={() => setSelectedBodyPart(null)}
                >
                  닫기
                </button>
                <Link
                  href={`/chating?bodyPart=${selectedBodyPart}`}
                  className="flex-1 py-1.5 sm:py-2 bg-gradient-to-r from-[#6B925C] to-[#9EB384] text-white rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center"
                >
                  이 부위로 시작하기
                  <ArrowRight size={12} className="ml-1 sm:w-3.5 sm:h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* 최근 활동 */}
        <div>
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">최근 활동</h2>
            <button className="text-xs sm:text-sm text-[#6B925C] font-medium">전체보기</button>
          </div>
          
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
            {recentStretchings.map((item, idx) => (
              <div 
                key={item.id}
                className={`flex items-center p-2.5 sm:p-4 ${idx !== recentStretchings.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F9FFEB] rounded-full flex items-center justify-center text-[#6B925C] mr-2 sm:mr-3">
                  <TrendingUp size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm sm:text-base text-gray-800">{item.title}</h3>
                  <div className="flex text-xs sm:text-sm text-gray-500 mt-0.5">
                    <span>{item.time}</span>
                    <span className="mx-1 sm:mx-1.5">•</span>
                    <span>{item.duration}</span>
                  </div>
                </div>
                <button className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* 하단 네비게이션 */}
      <Fnb />
      
      {/* 스타일 */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MainPage; 