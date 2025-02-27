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
    console.log(values);
    const { email, password } = values;
    setIsPending(true);
    setError('');
    setSuccess(false);
    try {
      const response = await fetch('login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('로그인 실패! 아이디 또는 비밀번호를 확인해라부기');
      }
      setSuccess(true);
      router.replace('/onboarding');
    } catch (error) {
      setError(error.message);
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
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {success && (
            <p className="text-[#9EBC5A] mt-2">로그인 성공이다부기!</p>
          )}
        </form>
      </Form>
    </div>
  );
};
