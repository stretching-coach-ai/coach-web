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

const LoginSchema = z.object({
  email: z.string().email({
    message: '유효하지 않은 이메일 형식이다부기.',
  }),
  password: z.string().min(1, {
    message: '비밀번호를 입력해라부기.',
  }),
});

export const LoginForm = () => {
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    console.log(values);
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
              로그인하기
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
