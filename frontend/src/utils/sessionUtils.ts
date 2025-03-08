/**
 * 세션 ID 관리 및 마이그레이션을 위한 유틸리티 함수
 */

/**
 * 현재 세션 ID를 로컬 스토리지에 저장
 * @param sessionId 저장할 세션 ID
 */
export const saveSessionId = (sessionId: string): void => {
  if (!sessionId) return;
  
  // 기존 세션 ID 확인
  const existingSessionId = localStorage.getItem('sessionId');
  
  // 기존 세션 ID가 있고 새 세션 ID와 다른 경우, 이전 세션 ID로 저장
  if (existingSessionId && existingSessionId !== sessionId) {
    console.log('이전 세션 ID 저장:', existingSessionId);
    localStorage.setItem('previousSessionId', existingSessionId);
  }
  
  // 새 세션 ID 저장
  console.log('세션 ID 저장:', sessionId);
  localStorage.setItem('sessionId', sessionId);
};

/**
 * 마이그레이션할 세션 ID 가져오기
 * @returns 마이그레이션할 세션 ID 또는 null
 */
export const getSessionIdToMigrate = (): string | null => {
  const previousSessionId = localStorage.getItem('previousSessionId');
  const currentSessionId = localStorage.getItem('sessionId');
  
  return previousSessionId || currentSessionId || null;
};

/**
 * 세션 마이그레이션 API 호출
 * @param sessionId 마이그레이션할 세션 ID
 * @returns 마이그레이션 결과
 */
export const migrateSession = async (sessionId: string): Promise<any> => {
  if (!sessionId) {
    console.log('마이그레이션할 세션 ID가 없음');
    return { success: false, error: '세션 ID가 없습니다.' };
  }
  
  try {
    console.log('세션 마이그레이션 시도 중...', sessionId);
    
    const migrateResponse = await fetch('/api/v1/sessions/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        session_id: sessionId
      }),
    });
    
    if (migrateResponse.ok) {
      const migrateData = await migrateResponse.json();
      console.log('세션 마이그레이션 응답:', migrateData);
      
      if (migrateData.success) {
        console.log('세션 마이그레이션 성공');
        console.log(`스트레칭 기록 ${migrateData.stretching_count}개, 대화 기록 ${migrateData.conversation_count}개 마이그레이션 완료`);
        
        // 마이그레이션 성공 후 이전 세션 ID 삭제
        localStorage.removeItem('previousSessionId');
        
        return migrateData;
      } else {
        console.error('세션 마이그레이션 실패:', migrateData.error);
        return { success: false, error: migrateData.error };
      }
    } else {
      console.error('세션 마이그레이션 실패:', migrateResponse.status);
      const errorData = await migrateResponse.json();
      console.error('마이그레이션 오류 상세:', errorData);
      return { success: false, error: errorData.detail || '마이그레이션 실패' };
    }
  } catch (error) {
    console.error('세션 마이그레이션 오류:', error);
    return { success: false, error: '마이그레이션 중 오류가 발생했습니다.' };
  }
};

/**
 * 로그인 후 온보딩 상태를 유지하는 함수
 * 기존에는 초기화했지만 이제는 온보딩 상태를 유지합니다
 */
export const resetOnboardingStatus = (): void => {
  try {
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) return;
    
    const userInfo = JSON.parse(userInfoStr);
    
    // 온보딩 상태가 이미 있는 경우 유지
    // 선택된 신체 부위가 있거나 onboardingCompleted가 true인 경우
    const hasSelectedBodyParts = userInfo.selected_body_parts && (
      (Array.isArray(userInfo.selected_body_parts) && userInfo.selected_body_parts.length > 0) ||
      (typeof userInfo.selected_body_parts === 'string' && userInfo.selected_body_parts.trim() !== '')
    );
    
    if (hasSelectedBodyParts || userInfo.onboardingCompleted === true) {
      console.log('온보딩 상태 유지:', { 
        selected_body_parts: userInfo.selected_body_parts,
        onboardingCompleted: userInfo.onboardingCompleted
      });
      return;
    }
    
    // 온보딩 상태가 없는 경우에만 기본값 설정
    const updatedUserInfo = {
      ...userInfo,
      // 기존 값이 없는 경우에만 기본값 설정
      selected_body_parts: userInfo.selected_body_parts || null,
      onboardingCompleted: userInfo.onboardingCompleted || false
    };
    
    console.log('온보딩 상태 설정:', { 
      before: { 
        selected_body_parts: userInfo.selected_body_parts,
        onboardingCompleted: userInfo.onboardingCompleted
      }, 
      after: { 
        selected_body_parts: updatedUserInfo.selected_body_parts,
        onboardingCompleted: updatedUserInfo.onboardingCompleted
      } 
    });
    
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
  } catch (error) {
    console.error('온보딩 상태 처리 오류:', error);
  }
}; 