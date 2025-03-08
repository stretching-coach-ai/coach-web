'use client';

import { useState, useEffect } from 'react';
import { Gnb } from '@/components/Gnb';
import { Fnb } from '@/components/Fnb';
import { Clock, PlayCircle, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Stardust } from '../fonts';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

const HistoryPage = () => {
  const [stretchingHistory, setStretchingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [stretchingDetails, setStretchingDetails] = useState<Record<string, any>>({});
  
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const router = useRouter();

  // 사용자 정보 가져오기
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        console.log('사용자 인증 확인 시작');
        
        const response = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('인증 응답 상태:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('인증 데이터:', data);
          
          if (data.is_authenticated && data.user) {
            setUser(data.user);
            if (data.session_id) {
              setSessionId(data.session_id);
              // 세션 ID를 로컬 스토리지에 저장
              localStorage.setItem('sessionId', data.session_id);
            }
          } else {
            // 로컬 스토리지에서 세션 ID 확인
            const storedSessionId = localStorage.getItem('sessionId');
            if (storedSessionId) {
              setSessionId(storedSessionId);
            } else {
              // 인증되지 않은 경우 로그인 페이지로 리다이렉트
              console.log('인증되지 않음, 로그인 페이지로 이동');
              router.push('/auth/login');
              return;
            }
          }
        } else {
          // 로컬 스토리지에서 세션 ID 확인
          const storedSessionId = localStorage.getItem('sessionId');
          if (storedSessionId) {
            setSessionId(storedSessionId);
          } else {
            // 인증되지 않은 경우 로그인 페이지로 리다이렉트
            console.log('인증되지 않음, 로그인 페이지로 이동');
            router.push('/auth/login');
            return;
          }
        }
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
        // 오류 발생 시 로그인 페이지로 리다이렉트
        router.push('/auth/login');
        return;
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // 스트레칭 히스토리 가져오기
  useEffect(() => {
    const fetchStretchingHistory = async () => {
      try {
        setLoading(true);
        
        console.log('스트레칭 히스토리 가져오기 시작');
        
        // 직접 백엔드 API 호출
        const response = await fetch('/api/v1/users/me/stretching-history', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        
        console.log('스트레칭 히스토리 응답 상태:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('스트레칭 히스토리 데이터:', data);
          
          // 데이터 형식 변환
          const formattedHistory = Array.isArray(data) ? data.map(item => ({
            id: item.id || Math.random().toString(),
            title: item.pain_description || '스트레칭 세션',
            time: new Date(item.created_at).toLocaleString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            duration: '10분',
            target: item.selected_body_parts || '전신',
            rawData: item
          })) : [];
          
          setStretchingHistory(formattedHistory);
          
          // URL 파라미터로 전달된 ID가 있으면 해당 카드를 자동으로 펼침
          if (selectedId) {
            setExpandedItems(prev => ({
              ...prev,
              [selectedId]: true
            }));
            
            // 상세 정보도 함께 가져옴
            const selectedItem = Array.isArray(data) ? 
              data.find(item => item.id === selectedId) : null;
              
            if (selectedItem) {
              setStretchingDetails(prev => ({
                ...prev,
                [selectedId]: selectedItem
              }));
            }
          }
        } else {
          console.error('스트레칭 히스토리를 가져오는데 실패했습니다:', response.status);
          setStretchingHistory([]);
        }
      } catch (error) {
        console.error('스트레칭 히스토리를 가져오는 중 오류 발생:', error);
        setStretchingHistory([]);
      } finally {
        setLoading(false);
      }
    };
    
    // 사용자 정보가 있을 때만 히스토리 가져오기
    if (user) {
      fetchStretchingHistory();
    } else {
      setLoading(false);
    }
  }, [user, selectedId]); // user와 selectedId가 변경될 때마다 실행

  // 스트레칭 세션 상세 정보 가져오기
  const fetchStretchingDetail = async (stretchingId: string) => {
    if (stretchingDetails[stretchingId]) {
      return; // 이미 상세 정보가 있으면 다시 가져오지 않음
    }
    
    try {
      const response = await fetch('/api/v1/users/me/stretching-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // 전체 히스토리에서 해당 ID의 세션 찾기
        const sessionDetail = Array.isArray(data) ? 
          data.find(item => item.id === stretchingId) : null;
        
        if (sessionDetail) {
          console.log('스트레칭 상세 정보:', sessionDetail);
          setStretchingDetails(prev => ({
            ...prev,
            [stretchingId]: sessionDetail
          }));
        } else {
          console.error('해당 ID의 스트레칭 세션을 찾을 수 없습니다:', stretchingId);
        }
      } else {
        console.error('스트레칭 상세 정보를 가져오는데 실패했습니다:', response.status);
        alert(`스트레칭 상세 정보를 가져오는데 실패했습니다: ${response.status}`);
      }
    } catch (error) {
      console.error('스트레칭 상세 정보를 가져오는 중 오류 발생:', error);
      alert(`스트레칭 상세 정보를 가져오는데 실패했습니다: ${error}`);
    }
  };

  // 카드 확장/축소 토글
  const toggleCard = (id: string) => {
    setExpandedItems(prev => {
      const newState = { ...prev, [id]: !prev[id] };
      
      // 카드가 확장되면 상세 정보 가져오기
      if (newState[id] && !stretchingDetails[id]) {
        fetchStretchingDetail(id);
      }
      
      return newState;
    });
  };

  // 스트레칭 가이드 텍스트 처리 함수
  const processGuideText = (text: string) => {
    if (!text) return '';
    
    // 줄바꿈 처리
    let processedText = text.replace(/\n/g, '<br>');
    
    // 볼드 텍스트 처리
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 참고 자료 섹션 찾기
    const referenceSection = processedText.includes('[참고 자료]') ? 
      processedText.split('[참고 자료]')[1] : '';
    
    // 참고 자료가 있으면 별도 처리
    if (referenceSection) {
      // 참고 자료 섹션 제외한 본문
      const mainContent = processedText.split('[참고 자료]')[0];
      
      // 참고 자료 섹션의 마크다운 링크 변환
      const processedReferences = referenceSection.replace(
        /- \[(.*?)\]\((https?:\/\/[^\s]+)\)/g, 
        '- <a href="$2" target="_blank" class="block py-1">$1</a>'
      );
      
      // 최종 텍스트 조합
      return mainContent + '<h3 class="text-[#6B925C] font-bold text-lg mt-2 mb-1">[참고 자료]</h3>' + processedReferences;
    }
    
    // 참고 자료가 없으면 일반 마크다운 링크만 변환
    return processedText.replace(
      /\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, 
      '<a href="$2" target="_blank">$1</a>'
    );
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#F9FFEB]">
      <Gnb />
      <div className="flex-1 pt-[72px] pb-[72px] px-4 bg-white">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6 mt-4">
            <Link href="/main" className="mr-3">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h1 className={`${Stardust.className} text-xl font-bold`}>스트레칭 히스토리</h1>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B925C]"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {stretchingHistory.length > 0 ? (
                stretchingHistory.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-[#93D400] transition-all duration-300 hover:shadow-md overflow-hidden"
                  >
                    <div 
                      className="p-4 flex justify-between items-center cursor-pointer"
                      onClick={() => toggleCard(item.id)}
                    >
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.time}
                          <span className="mx-1">•</span>
                          {item.duration}
                          <span className="mx-1">•</span>
                          <span className="bg-[#F9FFEB] text-[#6B925C] px-1.5 py-0.5 rounded-full text-xs">
                            {item.target}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button className="text-gray-500 p-1">
                          {expandedItems[item.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    {expandedItems[item.id] && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-2">
                        {stretchingDetails[item.id] ? (
                          <div>
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">스트레칭 정보</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-[#F9FFEB] p-2 rounded">
                                  <span className="text-gray-500">부위:</span> {item.target}
                                </div>
                                <div className="bg-[#F9FFEB] p-2 rounded">
                                  <span className="text-gray-500">날짜:</span> {item.time.split(',')[0]}
                                </div>
                                <div className="bg-[#F9FFEB] p-2 rounded">
                                  <span className="text-gray-500">시간:</span> {item.time.split(',')[1]}
                                </div>
                                <div className="bg-[#F9FFEB] p-2 rounded">
                                  <span className="text-gray-500">소요시간:</span> {item.duration}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">스트레칭 가이드</h4>
                              <div 
                                className="text-sm bg-white border border-gray-100 rounded-lg p-3 max-h-[300px] overflow-y-auto stretching-guide"
                                dangerouslySetInnerHTML={{ 
                                  __html: item.rawData.ai_response ? 
                                    processGuideText(item.rawData.ai_response) : 
                                    (item.rawData.text ? 
                                      processGuideText(item.rawData.text) : 
                                      '가이드 정보가 없습니다.')
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6B925C]"></div>
                          </div>
                        )}
                      </div>
                    )}
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
                  <p className="text-gray-500 mb-3">아직 스트레칭 기록이 없습니다.</p>
                  <Link 
                    href="/onboarding"
                    className="bg-[#6B925C] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#5A7F4B] transition-colors inline-block"
                  >
                    첫 스트레칭 시작하기
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Fnb />
    </main>
  );
};

export default HistoryPage; 