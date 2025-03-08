'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Stardust } from '@/app/fonts';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetOnboardingStatus, migrateSession } from '@/utils/sessionUtils';

// API URL 환경 변수 제거
// const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const LoginSchema = z.object({
  email: z.string().email({
    message: '유효하지 않은 이메일 형식이다부기.',
  }),
  password: z.string().min(1, {
    message: '비밀번호를 입력해라부기.',
  }),
});

export const LoginForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    const { email, password } = values;
    setIsPending(true);
    setError('');
    setSuccess(false);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json(); // 서버에서 응답한 에러 메시지 가져오기
        console.log(errorData);
        throw new Error(
          errorData.detail === 'Invalid credentials'
            ? '해당 이메일로 가입된 계정이 없다부기'
            : '로그인 실패! 아이디 또는 비밀번호를 확인해라부기',
        );
      }
      setSuccess(true);
      const data = await response.json();
      // 로그인 성공 처리
      console.log('로그인 성공:', data);
      
      // 인증 상태 로컬 스토리지에 저장
      if (data && data.is_authenticated && data.user) {
        // 로그인 상태 플래그 저장
        localStorage.setItem('isLoggedIn', 'true');
        
        // 사용자 정보 저장
        const userInfo: {
          isLoggedIn: boolean;
          id: any;
          name: any;
          email: any;
          selected_body_parts?: string | null;
          onboardingCompleted?: boolean;
        } = {
          isLoggedIn: true,
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        };
        
        // 온보딩 상태 확인을 위한 추가 API 호출
        try {
          // 사용자의 온보딩 정보 확인 (예: 선택한 신체 부위 등)
          const userDataResponse = await fetch('/api/v1/users/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          if (userDataResponse.ok) {
            const userData = await userDataResponse.json();
            console.log('사용자 상세 정보:', userData);
            
            // 온보딩 데이터가 있는 경우 (예: selected_body_parts 필드가 있는 경우)
            if (userData.selected_body_parts && userData.selected_body_parts.length > 0) {
              userInfo.selected_body_parts = userData.selected_body_parts;
              userInfo.onboardingCompleted = true;
            } else {
              // 기존 로컬 스토리지의 온보딩 정보 확인
              const existingUserInfoStr = localStorage.getItem('userInfo');
              if (existingUserInfoStr) {
                try {
                  const existingUserInfo = JSON.parse(existingUserInfoStr);
                  
                  // 선택된 신체 부위 확인 (배열 또는 문자열 모두 처리)
                  const hasSelectedBodyParts = existingUserInfo.selected_body_parts && (
                    (Array.isArray(existingUserInfo.selected_body_parts) && existingUserInfo.selected_body_parts.length > 0) ||
                    (typeof existingUserInfo.selected_body_parts === 'string' && existingUserInfo.selected_body_parts.trim() !== '')
                  );
                  
                  // 기존 온보딩 정보가 있으면 유지
                  if (hasSelectedBodyParts || existingUserInfo.onboardingCompleted === true) {
                    userInfo.selected_body_parts = existingUserInfo.selected_body_parts;
                    userInfo.onboardingCompleted = true;
                  } else {
                    // 온보딩 데이터가 없는 경우 (온보딩 필요)
                    userInfo.onboardingCompleted = false;
                  }
                } catch (e) {
                  console.error('기존 사용자 정보 파싱 오류:', e);
                  userInfo.onboardingCompleted = false;
                }
              } else {
                // 온보딩 데이터가 없는 경우 (온보딩 필요)
                userInfo.onboardingCompleted = false;
              }
            }
          } else {
            // API 호출 실패 시 기존 로컬 스토리지 정보 확인
            const existingUserInfoStr = localStorage.getItem('userInfo');
            if (existingUserInfoStr) {
              try {
                const existingUserInfo = JSON.parse(existingUserInfoStr);
                
                // 선택된 신체 부위 확인 (배열 또는 문자열 모두 처리)
                const hasSelectedBodyParts = existingUserInfo.selected_body_parts && (
                  (Array.isArray(existingUserInfo.selected_body_parts) && existingUserInfo.selected_body_parts.length > 0) ||
                  (typeof existingUserInfo.selected_body_parts === 'string' && existingUserInfo.selected_body_parts.trim() !== '')
                );
                
                // 기존 온보딩 정보가 있으면 유지
                if (hasSelectedBodyParts || existingUserInfo.onboardingCompleted === true) {
                  userInfo.selected_body_parts = existingUserInfo.selected_body_parts;
                  userInfo.onboardingCompleted = true;
                } else {
                  userInfo.onboardingCompleted = false;
                }
              } catch (e) {
                console.error('기존 사용자 정보 파싱 오류:', e);
                userInfo.onboardingCompleted = false;
              }
            } else {
              userInfo.onboardingCompleted = false;
            }
          }
        } catch (error) {
          console.error('사용자 온보딩 정보 확인 오류:', error);
          // 오류 발생 시 기존 로컬 스토리지 정보 확인
          const existingUserInfoStr = localStorage.getItem('userInfo');
          if (existingUserInfoStr) {
            try {
              const existingUserInfo = JSON.parse(existingUserInfoStr);
              // 선택된 신체 부위 확인 (배열 또는 문자열 모두 처리)
              const hasSelectedBodyParts = existingUserInfo.selected_body_parts && (
                (Array.isArray(existingUserInfo.selected_body_parts) && existingUserInfo.selected_body_parts.length > 0) ||
                (typeof existingUserInfo.selected_body_parts === 'string' && existingUserInfo.selected_body_parts.trim() !== '')
              );
              
              // 기존 온보딩 정보가 있으면 유지
              if (hasSelectedBodyParts || existingUserInfo.onboardingCompleted === true) {
                userInfo.selected_body_parts = existingUserInfo.selected_body_parts;
                userInfo.onboardingCompleted = true;
              } else {
                userInfo.onboardingCompleted = false;
              }
            } catch (e) {
              console.error('기존 사용자 정보 파싱 오류:', e);
              userInfo.onboardingCompleted = false;
            }
          } else {
            userInfo.onboardingCompleted = false;
          }
        }
        
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        console.log('사용자 정보 로컬 저장 완료 (온보딩 상태 유지):', userInfo);
        
        // 세션 마이그레이션 시도 (이전 세션 ID가 있는 경우)
        try {
          // 이전에 저장된 세션 ID 확인
          const previousSessionId = localStorage.getItem('previousSessionId');
          const currentSessionId = localStorage.getItem('sessionId');
          const sessionIdToMigrate = previousSessionId || currentSessionId;
          
          if (sessionIdToMigrate) {
            console.log('세션 마이그레이션 시도 중...', sessionIdToMigrate);
            
            // sessionUtils의 migrateSession 함수 사용
            const migrationResult = await migrateSession(sessionIdToMigrate);
            
            if (migrationResult.success) {
              // 마이그레이션 성공 처리
              if (migrationResult.stretching_count > 0 || migrationResult.conversation_count > 0) {
                // 마이그레이션된 데이터가 있는 경우 알림
                console.log(`스트레칭 기록 ${migrationResult.stretching_count}개, 대화 기록 ${migrationResult.conversation_count}개 마이그레이션 완료`);
              }
            } else {
              console.error('세션 마이그레이션 실패:', migrationResult.error);
            }
          } else {
            console.log('마이그레이션할 세션 ID가 없음');
          }
        } catch (migrateError) {
          console.error('세션 마이그레이션 오류:', migrateError);
        }
      }
      
      // 로그인 후 리다이렉트
      if (data && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push('/main');
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('알 수 없는 에러 발생');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={`${Stardust.className} mt-9 w-[390px] m-auto`}>
      <div className="mb-[60px] flex items-center justify-center">
        <p className="text-[#689700] text-[32px]">로그인</p>
      </div>
      <Header title="로그인이다부기!" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-[30px]">
          <div className="space-y-9 w-[339px] m-auto">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="relative h-[63px]">
                  <FormLabel className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-md">
                    이메일
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={false}
                      placeholder="꾸북스딱스꾸부기"
                      className={cn(field.value && 'bg-[#F7FFE5]')}
                    />
                  </FormControl>
                  <FormMessage className="text-[#9EBC5A]" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="relative h-[63px]">
                  <FormLabel className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-md">
                    비밀번호
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      disabled={false}
                      className={cn(field.value && 'bg-[#F7FFE5]')}
                    />
                  </FormControl>
                  <FormMessage className="text-[#9EBC5A]" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="main"
              size="main"
              disabled={!form.formState.isValid}
            >
              {isPending ? '로그인 중...' : '로그인'}
            </Button>
          </div>
          {error && (
            <p className="block w-[339px] m-auto text-red-500 mt-2">{error}</p>
          )}
          {success && (
            <p className="block w-[339px] m-auto text-[#9EBC5A] mt-2">
              로그인 성공이다부기!
            </p>
          )}
        </form>
      </Form>
    </div>
  );
};
