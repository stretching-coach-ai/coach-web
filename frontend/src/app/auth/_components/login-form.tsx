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
      router.replace('/onboarding');
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
