'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Calendar, ArrowRight, Heart, User, Clock, PlayCircle, ChevronUp, ChevronDown, Repeat, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { Stardust } from '../fonts';

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
  const [sessionLoading, setSessionLoading] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  const [recommendedStretchings, setRecommendedStretchings] = useState<any[]>([]);
  const [recentStretchings, setRecentStretchings] = useState<any[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  
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
  
  // 전체 접기/펼치기 토글
  const toggleAllExercises = () => {
    setAllExpanded(!allExpanded);
    
    // 모든 운동의 상태를 변경
    const newExpandedState: {[key: string]: boolean} = {};
    bodyPartExercises.forEach((muscleData, muscleIndex) => {
      muscleData.exercises.forEach((_, exerciseIndex) => {
        const key = `${muscleIndex}-${exerciseIndex}`;
        newExpandedState[key] = !allExpanded;
      });
    });
    
    setExpandedExercises(newExpandedState);
  };
  
  // 특정 운동이 펼쳐져 있는지 확인
  const isExerciseExpanded = (muscleIndex: number, exerciseIndex: number) => {
    const key = `${muscleIndex}-${exerciseIndex}`;
    // expandedExercises에 해당 키가 없으면 기본값(allExpanded)을 사용
    return expandedExercises[key] === undefined ? allExpanded : expandedExercises[key];
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
            const data = await get_muscle_exercises(muscle);
            return {
              muscle: muscle,
              exercises: data.exercises || []
            };
          } catch (error) {
            console.error(`${muscle} 운동 데이터를 가져오는 중 오류 발생:`, error);
            return { muscle, exercises: [] };
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
  
  // 오늘의 추천 스트레칭 가져오기
  const fetchRecommendedStretchings = async () => {
    try {
      setLoadingRecommended(true);
      const response = await fetch('/api/v1/session/popular-stretches');
      if (response.ok) {
        const data = await response.json();
        setRecommendedStretchings(data);
      } else {
        console.error('추천 스트레칭을 가져오는데 실패했습니다:', response.status);
        // 기본 데이터 설정
        setRecommendedStretchings([
          {
            id: '1',
            title: '목 스트레칭',
            short_description: '장시간 앉아있는 사람들을 위한 목 스트레칭',
            color: 'from-green-400 to-green-600',
            guide: { duration: '5-10분' },
            target: '목',
            level: '초급',
            condition: '거북목'
          },
          {
            id: '2',
            title: '어깨 스트레칭',
            short_description: '어깨 통증 완화를 위한 스트레칭',
            color: 'from-blue-400 to-blue-600',
            guide: { duration: '5-10분' },
            target: '어깨',
            level: '중급',
            condition: '어깨 통증'
          },
          {
            id: '3',
            title: '허리 스트레칭',
            short_description: '허리 통증 완화를 위한 스트레칭',
            color: 'from-purple-400 to-purple-600',
            guide: { duration: '5-10분' },
            target: '허리',
            level: '초급',
            condition: '요통'
          }
        ]);
      }
    } catch (error) {
      console.error('추천 스트레칭을 가져오는 중 오류 발생:', error);
      // 기본 데이터 설정
      setRecommendedStretchings([
        {
          id: '1',
          title: '목 스트레칭',
          short_description: '장시간 앉아있는 사람들을 위한 목 스트레칭',
          color: 'from-green-400 to-green-600',
          guide: { duration: '5-10분' },
          target: '목',
          level: '초급',
          condition: '거북목'
        },
        {
          id: '2',
          title: '어깨 스트레칭',
          short_description: '어깨 통증 완화를 위한 스트레칭',
          color: 'from-blue-400 to-blue-600',
          guide: { duration: '5-10분' },
          target: '어깨',
          level: '중급',
          condition: '어깨 통증'
        },
        {
          id: '3',
          title: '허리 스트레칭',
          short_description: '허리 통증 완화를 위한 스트레칭',
          color: 'from-purple-400 to-purple-600',
          guide: { duration: '5-10분' },
          target: '허리',
          level: '초급',
          condition: '요통'
        }
      ]);
    } finally {
      setLoadingRecommended(false);
    }
  };
  
  // 최근 활동 가져오기
  const fetchRecentActivities = async () => {
    try {
      setLoadingRecent(true);
      
      // 프록시 API를 통해 최근 활동 가져오기
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: '/api/v1/me/stretching-history',
          method: 'GET',
          params: {
            limit: 3
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('최근 스트레칭 히스토리:', data);
        
        // 데이터 형식 변환
        const formattedHistory = Array.isArray(data) ? data.map(item => ({
          id: item.id || Math.random().toString(),
          title: item.user_input?.pain_description || '스트레칭 세션',
          time: new Date(item.created_at).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          duration: '10분',
          target: item.user_input?.selected_body_parts || '전신',
          rawData: item
        })) : [];
        
        setRecentStretchings(formattedHistory);
      } else {
        console.error('최근 활동을 가져오는데 실패했습니다:', response.status);
        // 기본 데이터 설정
        setRecentStretchings([]);
      }
    } catch (error) {
      console.error('최근 활동을 가져오는 중 오류 발생:', error);
      // 기본 데이터 설정
      setRecentStretchings([]);
    } finally {
      setLoadingRecent(false);
    }
  };
  
  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    fetchRecommendedStretchings();
  }, []);
  
  // 사용자 정보 또는 세션 ID가 변경될 때 최근 활동 가져오기
  useEffect(() => {
    if (user || sessionId) {
      fetchRecentActivities();
    }
  }, [user, sessionId]);
  
  // 근육을 카테고리별로 분류 - 컴포넌트 외부로 이동하여 재사용 가능하게 함
  const muscleCategories = {
    '목': { id: 'neck', muscles: ['흉쇄유돌근'], color: 'bg-[#FFE8E8] text-[#D86161]' },
    '어깨': { id: 'shoulder', muscles: ['삼각근', '승모근'], color: 'bg-[#FFF4E0] text-[#E6A23C]' },
    '등/허리': { id: 'back', muscles: ['광배근', '승모근'], color: 'bg-[#E6F7FF] text-[#1890FF]' },
    '팔/손목': { id: 'arm', muscles: ['삼두근', '전완근', '단두', '장두'], color: 'bg-[#F0E6FF] text-[#722ED1]' },
    '다리': { id: 'leg', muscles: ['대퇴직근', '내전근', '외측광근', '내측광근', '대둔근', '비복근', '반건양근', '전경골근', '봉공근'], color: 'bg-[#E6FFEC] text-[#52C41A]' },
    '가슴/복부': { id: 'chest', muscles: ['대흉근', '복직근', '외복사근'], color: 'bg-[#E6F4FF] text-[#1677FF]' }
  };
  
  const getBodyParts = () => {
    if (loading || muscles.length === 0) {
      return [
        { id: 'neck', name: '목', count: 0, color: 'bg-[#FFE8E8] text-[#D86161]', muscles: ['흉쇄유돌근'] },
        { id: 'shoulder', name: '어깨', count: 0, color: 'bg-[#FFF4E0] text-[#E6A23C]', muscles: ['삼각근', '승모근'] },
        { id: 'back', name: '등/허리', count: 0, color: 'bg-[#E6F7FF] text-[#1890FF]', muscles: ['광배근', '승모근'] },
        { id: 'arm', name: '팔/손목', count: 0, color: 'bg-[#F0E6FF] text-[#722ED1]', muscles: ['삼두근', '전완근', '단두', '장두'] },
        { id: 'leg', name: '다리', count: 0, color: 'bg-[#E6FFEC] text-[#52C41A]', muscles: ['대퇴직근', '내전근', '외측광근', '내측광근', '대둔근', '비복근', '반건양근', '전경골근', '봉공근'] },
        { id: 'chest', name: '가슴/복부', count: 0, color: 'bg-[#E6F4FF] text-[#1677FF]', muscles: ['대흉근', '복직근', '외복사근'] }
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
    };
    enhanced_metadata?: any;
    [key: string]: any;
  }
  
  interface MuscleData {
    muscle: string;
    exercises: Exercise[];
  }
  
  // 영어 콘텐츠 필터링 유틸리티 함수
  const filterEnglishContent = (text: string | undefined): boolean => {
    if (!text) return false;
    
    // 영어 학술 용어 및 일반적인 영어 단어 패턴 확인
    const academicPattern = /Effect|impact|study|research|randomized|clinical|trial|CONSORT|OBJECTIVE|BACKGROUND|METHODS|RESULTS|CONCLUSION|Comparison|Abstract/i;
    const commonEnglishPattern = /\b(A|The|This|of|on|in|with|for|and|or|to|by|is|are|was|were)\b/i;
    const longEnglishWordPattern = /[a-zA-Z]{3,}/;
    
    // 영어 문장 구조 패턴 (마침표 뒤에 공백 후 대문자로 시작하는 패턴)
    const englishSentencePattern = /\.\s+[A-Z]/;
    
    // 영어 비율 계산 (영문자 수 / 전체 텍스트 길이)
    const englishCharCount = (text.match(/[a-zA-Z]/g) || []).length;
    const englishRatio = englishCharCount / text.length;
    
    // 다음 조건 중 하나라도 만족하면 영어 콘텐츠로 판단
    return (
      academicPattern.test(text) || 
      (commonEnglishPattern.test(text) && longEnglishWordPattern.test(text)) ||
      englishSentencePattern.test(text) ||
      englishRatio > 0.4 // 텍스트의 40% 이상이 영문자인 경우
    );
  };
  
  const get_muscle_exercises = async (bodyPart: string) => {
    try {
      const response = await fetch(`/api/v1/muscles/${bodyPart}/exercises`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // 각 운동에 고유한 제목과 아이콘 추가
      if (data.exercises && data.exercises.length > 0) {
        data.exercises = data.exercises.map((exercise: any, index: number) => {
          // 기본 제목에 번호 추가
          exercise.한글_제목 = `${bodyPart} 스트레칭 ${index + 1}`;
          exercise.순서 = index + 1; // 순서 번호 추가
          
          // 효과나 목적이 있으면 제목에 추가
          if (exercise.효과_및_적용?.주요_효과 && exercise.효과_및_적용.주요_효과.length > 0) {
            exercise.한글_제목 = `${bodyPart} ${exercise.효과_및_적용.주요_효과[0]} 스트레칭`;
          } else if (exercise.목적) {
            exercise.한글_제목 = `${bodyPart} ${exercise.목적} 스트레칭`;
          }
          
          // 난이도에 따른 아이콘 추가
          if (exercise.난이도) {
            exercise.난이도_아이콘 = exercise.난이도.includes('초급') ? '🟢' : 
                                    exercise.난이도.includes('중급') ? '🟠' : 
                                    exercise.난이도.includes('고급') ? '🔴' : '⚪';
          } else {
            exercise.난이도_아이콘 = '⚪';
          }
          
          return exercise;
        });
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching exercises:", error);
      return { muscle: bodyPart, exercises: [] };
    }
  };
  
  // 추천 스트레칭 상세 정보 토글
  const toggleRecommendationDetails = (id: string) => {
    setExpandedRecommendation(prev => prev === id ? null : id);
  };
  
  return (
    <div className="pb-20 max-w-md mx-auto bg-gray-50 min-h-screen">
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
      
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
                <h2 className={`${Stardust.className} text-lg font-bold text-[#6B925C]`}>
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
                <h2 className={`${Stardust.className} text-xl font-bold`}>지금 바로 시작하세요</h2>
                <p className={`${Stardust.className} text-sm mt-1 opacity-90`}>맞춤형 스트레칭으로 건강한 하루를!</p>
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
              <h2 className={`${Stardust.className} text-lg font-bold flex items-center`}>
                <Heart className="w-5 h-5 mr-2 text-[#6B925C]" />
                오늘의 추천
              </h2>
            </div>
            
            {loadingRecommended ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B925C]"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendedStretchings.length > 0 ? (
                  recommendedStretchings.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-[#93D400] transform hover:translate-y-[-2px]"
                    >
                      <div className={`h-auto bg-gradient-to-r ${item.color} flex flex-col p-4`}>
                        <div className="text-white">
                          <div className="flex justify-between items-center">
                            <h3 className={`${Stardust.className} font-bold text-lg`}>{item.title}</h3>
                            <div className="flex space-x-2">
                              <span className="bg-white bg-opacity-30 text-white text-xs px-2 py-1 rounded-full">
                                {item.condition}
                              </span>
                              <span className="bg-white bg-opacity-30 text-white text-xs px-2 py-1 rounded-full">
                                {item.level}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-xs mt-2">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.guide?.duration || '5-10분'}
                            <span className="mx-2">•</span>
                            <span>{item.target}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className={`${Stardust.className} text-sm text-gray-600 mb-3`}>{item.short_description}</p>
                        
                        <div className="mb-3">
                          <h4 className={`${Stardust.className} text-sm font-semibold mb-1`}>주요 효과</h4>
                          <div className="flex flex-wrap gap-1">
                            {item.effects && item.effects.length > 0 ? (
                              item.effects.map((effect: string, index: number) => (
                                <span key={index} className="text-xs bg-[#F9FFEB] text-[#6B925C] px-2 py-1 rounded-full">
                                  {effect}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs bg-[#F9FFEB] text-[#6B925C] px-2 py-1 rounded-full">
                                통증 완화
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => toggleRecommendationDetails(item.id)}
                          className="w-full mt-2 text-sm font-medium text-white bg-[#6B925C] py-2 rounded-lg flex items-center justify-center group hover:bg-[#5A7F4B] transition-colors"
                        >
                          {expandedRecommendation === item.id ? "접기" : "자세히 보기"}
                          {expandedRecommendation === item.id ? 
                            <ChevronUp className="w-3 h-3 ml-1" /> : 
                            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          }
                        </button>
                        
                        {/* 상세 정보 영역 */}
                        {expandedRecommendation === item.id && (
                          <div className="mt-4 pt-3 border-t border-gray-200 animate-slideDown">
                            {/* 전체 수행 방법 */}
                            {item.steps && item.steps.length > 0 && (
                              <div className="mb-4">
                                <h4 className={`${Stardust.className} text-sm font-semibold mb-2`}>전체 수행 방법</h4>
                                <ol className="text-sm text-gray-600 space-y-2 pl-2">
                                  {item.steps.map((step: string, index: number) => (
                                    <li key={index} className="flex">
                                      <span className="bg-[#E5FFA9] text-[#6B925C] w-5 h-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                        {index + 1}
                                      </span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            
                            {/* 추천 가이드 */}
                            <div className="mb-4 bg-[#F9FFEB] p-3 rounded-lg">
                              <h4 className={`${Stardust.className} text-sm font-semibold mb-2`}>추천 가이드</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2 text-[#6B925C]" />
                                  <span>유지: {item.guide?.hold || '10-15초'}</span>
                                </div>
                                <div className="flex items-center">
                                  <Repeat className="w-4 h-4 mr-2 text-[#6B925C]" />
                                  <span>반복: {item.guide?.repetitions || '3-5회'}</span>
                                </div>
                                <div className="flex items-center col-span-2">
                                  <Calendar className="w-4 h-4 mr-2 text-[#6B925C]" />
                                  <span>빈도: {item.guide?.frequency || '매일 1-2회'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* 주의사항 */}
                            {item.cautions && item.cautions.length > 0 && (
                              <div className="mb-4 bg-[#FFF0F0] p-3 rounded-lg">
                                <h4 className={`${Stardust.className} text-sm font-semibold mb-2 text-[#FF6B6B]`}>주의사항</h4>
                                <ul className="text-sm text-gray-600 space-y-1 pl-2">
                                  {item.cautions.map((caution: string, index: number) => (
                                    <li key={index} className="list-disc list-inside">{caution}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* 적용 대상 */}
                            {item.target_audience && (
                              <div className="mb-4">
                                <h4 className={`${Stardust.className} text-sm font-semibold mb-2`}>적용 대상</h4>
                                <p className="text-sm text-gray-600">{item.target_audience}</p>
                              </div>
                            )}
                            
                            {/* 관련 자료 */}
                            {item.reference_url && (
                              <div className="pt-2 border-t border-gray-200">
                                <h4 className={`${Stardust.className} text-sm font-semibold mb-1`}>관련 문서</h4>
                                <a 
                                  href={item.reference_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center text-sm text-blue-500 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  <span>참고 자료</span>
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl p-6 shadow-sm text-center border border-gray-100">
                    <div className="w-16 h-16 mx-auto mb-3 opacity-50">
                      <Image
                        src="/images/empty-state.png"
                        alt="추천 없음"
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                    <p className="text-gray-500 mb-3">아직 추천 스트레칭이 없습니다.</p>
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
            )}
          </div>
          
          {/* 부위별 스트레칭 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${Stardust.className} text-lg font-bold flex items-center`}>
                <Activity className="w-5 h-5 mr-2 text-[#6B925C]" />
                부위별 스트레칭
              </h2>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {bodyParts.map((part) => (
                <button
                  key={part.id}
                  onClick={() => handleBodyPartClick(part.id)}
                  className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                    selectedBodyPart === part.id
                      ? 'bg-[#93D400] text-white shadow-md scale-105'
                      : `${part.color} shadow-sm hover:shadow hover:scale-[1.02]`
                  }`}
                >
                  <span className={`${Stardust.className} text-sm font-medium`}>{part.name}</span>
                  {part.muscles && (
                    <span className={`${Stardust.className} text-xs mt-1 opacity-80 text-center`}>
                      {part.muscles.slice(0, 2).join(', ')}
                      {part.muscles.length > 2 && ' 외'}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* 선택된 부위의 운동 표시 */}
            {selectedBodyPart && (
              <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`${Stardust.className} font-bold flex items-center`}>
                    <span className="w-6 h-6 bg-[#E5FFA9] rounded-full flex items-center justify-center mr-2 text-xs text-[#6B925C]">
                      {Object.keys(muscleCategories).findIndex(key => muscleCategories[key as keyof typeof muscleCategories].id === selectedBodyPart) + 1}
                    </span>
                    {Object.keys(muscleCategories).find(key => muscleCategories[key as keyof typeof muscleCategories].id === selectedBodyPart)} 스트레칭
                  </h3>
                  
                  {/* 전체 접기/펼치기 버튼 */}
                  <button 
                    onClick={toggleAllExercises}
                    className="text-sm flex items-center text-[#6B925C] hover:underline"
                  >
                    {allExpanded ? (
                      <>전체 접기 <ChevronUp className="w-4 h-4 ml-1" /></>
                    ) : (
                      <>전체 펼치기 <ChevronDown className="w-4 h-4 ml-1" /></>
                    )}
                  </button>
                </div>
                
                {loadingExercises ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B925C]"></div>
                  </div>
                ) : bodyPartExercises.length > 0 ? (
                  <div className="space-y-4">
                    {bodyPartExercises.map((muscleData, muscleIndex) => (
                      <div key={`muscle-${muscleIndex}`} className="mb-8">
                        {muscleData.exercises && muscleData.exercises.length > 0 ? (
                          <div>
                            {muscleData.exercises.map((exercise, exerciseIndex) => (
                              <div
                                key={`exercise-${muscleIndex}-${exerciseIndex}`}
                                className={`mb-2 p-2 rounded-lg transition-all duration-300 ${
                                  isExerciseExpanded(muscleIndex, exerciseIndex)
                                    ? "bg-[#F9FFEB]"
                                    : "bg-white hover:bg-gray-50"
                                }`}
                              >
                                <div
                                  className="flex items-center justify-between cursor-pointer"
                                  onClick={() => toggleExerciseDetails(muscleIndex, exerciseIndex)}
                                >
                                  <div className="flex items-center overflow-hidden max-w-[65%]">
                                    {/* 순서 번호 제거 */}
                                    
                                    <div className="overflow-hidden">
                                      <h3 className="text-sm font-medium truncate">{exercise.한글_제목}</h3>
                                      {/* 간략 설명 또는 효과 추가 - 접었을 때만 표시 */}
                                      {!isExerciseExpanded(muscleIndex, exerciseIndex) && (
                                        <p className="text-xs text-gray-500 truncate">
                                          {!filterEnglishContent(exercise.간략_설명) ? exercise.간략_설명 : 
                                           (exercise.효과_및_적용?.주요_효과 && exercise.효과_및_적용.주요_효과.length > 0 && 
                                            !filterEnglishContent(exercise.효과_및_적용.주요_효과[0])) ? exercise.효과_및_적용.주요_효과[0] : ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center flex-shrink-0">
                                    {/* 난이도 아이콘 항상 표시 - 고정 너비로 설정 */}
                                    <div className="w-6 flex-shrink-0 flex justify-center">
                                      {exercise.난이도_아이콘 && (
                                        <span className="text-sm">{exercise.난이도_아이콘}</span>
                                      )}
                                    </div>
                                    {/* 태그가 있으면 첫 번째 태그를 작은 배지로 표시 - 최대 너비 제한 */}
                                    <div className="w-[80px] flex-shrink-0 overflow-hidden mr-1">
                                      {exercise.태그 && exercise.태그.length > 0 && (
                                        <span className="inline-block px-1.5 py-0.5 text-xs bg-[#E8F4D9] text-[#6B925C] rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                          {exercise.태그[0]}
                                        </span>
                                      )}
                                    </div>
                                    <ChevronDown 
                                      className={`w-4 h-4 text-gray-500 transition-transform ${
                                        isExerciseExpanded(muscleIndex, exerciseIndex) ? "rotate-180" : ""
                                      }`} 
                                    />
                                  </div>
                                </div>
                                
                                {/* 운동 상세 정보 - 접기/펼치기 가능 */}
                                {isExerciseExpanded(muscleIndex, exerciseIndex) && (
                                  <div className="mt-3 text-sm text-gray-600 animate-slideUp">
                                    {/* 난이도 정보 표시 */}
                                    {exercise.난이도 && (
                                      <div className="mb-3 flex items-center">
                                        <span className="mr-2 text-lg">{exercise.난이도_아이콘}</span>
                                        <span className="font-medium">{exercise.난이도}</span>
                                      </div>
                                    )}
                                    
                                    {/* 간략 설명 표시 - 영어 초록 필터링 강화 */}
                                    {exercise.간략_설명 && !filterEnglishContent(exercise.간략_설명) && (
                                      <p className="mb-3 bg-gray-50 p-2 rounded-md">
                                        <span className="font-medium text-[#6B925C] block mb-1">간략 설명</span>
                                        {exercise.간략_설명}
                                      </p>
                                    )}
                                    
                                    {/* 목적 정보 표시 */}
                                    {exercise.목적 && !filterEnglishContent(exercise.목적) && (
                                      <div className="mt-3">
                                        <h6 className="font-medium text-[#6B925C] mb-1">목적</h6>
                                        <p>{exercise.목적}</p>
                                      </div>
                                    )}
                                    
                                    {exercise.스트레칭_방법?.동작_단계 && (
                                      <div className="mt-3">
                                        <h6 className="font-medium text-[#6B925C] mb-1">수행 방법</h6>
                                        <ol className="list-decimal list-inside space-y-1">
                                          {exercise.스트레칭_방법.동작_단계
                                            .filter((step: string) => !filterEnglishContent(step))
                                            .map((step: string, stepIndex: number) => (
                                              <li key={stepIndex} className="pl-1">{step}</li>
                                            ))}
                                        </ol>
                                      </div>
                                    )}
                                    
                                    {exercise.protocol?.steps && !exercise.스트레칭_방법?.동작_단계 && (
                                      <div className="mt-3">
                                        <h6 className="font-medium text-[#6B925C] mb-1">수행 방법</h6>
                                        <ol className="list-decimal list-inside space-y-1">
                                          {exercise.protocol.steps
                                            .filter((step: string) => !filterEnglishContent(step))
                                            .map((step: string, stepIndex: number) => (
                                              <li key={stepIndex} className="pl-1">{step}</li>
                                            ))}
                                        </ol>
                                      </div>
                                    )}
                                    
                                    {/* 효과 및 적용 정보 표시 */}
                                    {exercise.효과_및_적용?.주요_효과 && (
                                      <div className="mt-3">
                                        <h6 className="font-medium text-[#6B925C] mb-1">주요 효과</h6>
                                        <ul className="list-disc list-inside space-y-1">
                                          {exercise.효과_및_적용.주요_효과
                                            .filter((effect: string) => !filterEnglishContent(effect))
                                            .map((effect: string, effectIndex: number) => (
                                              <li key={effectIndex} className="pl-1 text-gray-700">{effect}</li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    {exercise.효과_및_적용?.적용_대상 && !filterEnglishContent(exercise.효과_및_적용.적용_대상) && (
                                      <div className="mt-3">
                                        <h6 className="font-medium text-[#6B925C] mb-1">적용 대상</h6>
                                        <p className="text-gray-700">{exercise.효과_및_적용.적용_대상}</p>
                                      </div>
                                    )}
                                    
                                    {/* 추천 시간 및 빈도 정보 */}
                                    {exercise.추천_시간_및_빈도 && (
                                      <div className="mt-3 bg-[#F9FFEB] p-3 rounded-lg">
                                        <h6 className="font-medium text-[#6B925C] mb-2">추천 가이드</h6>
                                        <div className="grid grid-cols-2 gap-3">
                                          {exercise.추천_시간_및_빈도.유지_시간 && (
                                            <div className="flex items-center">
                                              <Clock className="w-4 h-4 mr-2 text-[#6B925C]" />
                                              <span>유지: {exercise.추천_시간_및_빈도.유지_시간}</span>
                                            </div>
                                          )}
                                          {exercise.추천_시간_및_빈도.반복_횟수 && (
                                            <div className="flex items-center">
                                              <Repeat className="w-4 h-4 mr-2 text-[#6B925C]" />
                                              <span>반복: {exercise.추천_시간_및_빈도.반복_횟수}</span>
                                            </div>
                                          )}
                                          {exercise.추천_시간_및_빈도.주간_빈도 && (
                                            <div className="flex items-center col-span-2">
                                              <Calendar className="w-4 h-4 mr-2 text-[#6B925C]" />
                                              <span>빈도: {exercise.추천_시간_및_빈도.주간_빈도}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* 안전 및 주의사항 */}
                                    {(exercise.안전_및_주의사항?.수행_시_주의점 || exercise.안전_및_주의사항?.금기사항) && (
                                      <div className="mt-4 bg-[#FFF0F0] p-3 rounded-lg">
                                        {exercise.안전_및_주의사항?.수행_시_주의점 && (
                                          <div className="mb-2">
                                            <h6 className="font-medium text-[#FF6B6B] mb-1">주의사항</h6>
                                            <ul className="list-disc list-inside space-y-1">
                                              {exercise.안전_및_주의사항.수행_시_주의점
                                                .filter((point: string) => !filterEnglishContent(point))
                                                .map((point: string, pointIndex: number) => (
                                                  <li key={pointIndex} className="pl-1 text-gray-700">{point}</li>
                                                ))}
                                            </ul>
                                          </div>
                                        )}
                                        
                                        {exercise.안전_및_주의사항?.금기사항 && (
                                          <div>
                                            <h6 className="font-medium text-[#FF6B6B] mb-1">금기사항</h6>
                                            <ul className="list-disc list-inside space-y-1">
                                              {exercise.안전_및_주의사항.금기사항
                                                .filter((point: string) => !filterEnglishContent(point))
                                                .map((point: string, pointIndex: number) => (
                                                  <li key={pointIndex} className="pl-1 text-gray-700">{point}</li>
                                                ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* 태그 정보 표시 */}
                                    {exercise.태그 && exercise.태그.length > 0 && (
                                      <div className="mt-4">
                                        <h6 className="font-medium text-[#6B925C] mb-1">관련 태그</h6>
                                        <div className="flex flex-wrap gap-1">
                                          {exercise.태그.slice(0, 3).map((tag: string, tagIndex: number) => (
                                            <span key={tagIndex} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* 관련 문서 링크 */}
                                    {(exercise.관련_자료?.url || exercise.evidence?.url) && (
                                      <div className="mt-4 pt-2 border-t border-gray-200">
                                        <h6 className="font-medium text-[#6B925C] mb-1">관련 문서</h6>
                                        <div className="space-y-1">
                                          {exercise.관련_자료?.url && (
                                            <a 
                                              href={exercise.관련_자료.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center text-blue-500 hover:underline"
                                            >
                                              <ExternalLink className="w-3 h-3 mr-1" />
                                              <span>참고 자료</span>
                                            </a>
                                          )}
                                          {!exercise.관련_자료?.url && exercise.evidence?.url && (
                                            <a 
                                              href={exercise.evidence.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="flex items-center text-blue-500 hover:underline"
                                            >
                                              <ExternalLink className="w-3 h-3 mr-1" />
                                              <span>참고 자료</span>
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500 py-4">해당 근육의 스트레칭 정보가 없습니다.</p>
                        )}
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
              <h2 className={`${Stardust.className} text-lg font-bold flex items-center`}>
                <Calendar className="w-5 h-5 mr-2 text-[#6B925C]" />
                최근 활동
              </h2>
              <Link href="/history" className={`${Stardust.className} text-sm text-[#6B925C] flex items-center group`}>
                전체보기 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {loadingRecent ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B925C]"></div>
              </div>
            ) : (
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
                      <Link 
                        href={`/history?id=${item.id}`} 
                        className="text-[#6B925C] hover:scale-110 transition-transform p-2 rounded-full hover:bg-[#F9FFEB]"
                      >
                        <PlayCircle className="w-6 h-6" />
                      </Link>
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
            )}
          </div>
        </div>
        
        {/* 하단 네비게이션 */}
        <Fnb />
      </div>
    </div>
  );
};

export default MainPage; 