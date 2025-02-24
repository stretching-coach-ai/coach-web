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
    <div className="max-w-md flex flex-col items-start m-auto">
      <Header title="로그인이다부기!" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-[30px] space-y-9"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="relative h-[63px]">
                <FormLabel className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-md">
                  이름
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={false}
                    placeholder="꾸북스딱스꾸부기"
                    className={cn(field.value && 'bg-[#F7FFE5]')}
                  />
                </FormControl>
                <FormMessage />
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
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" variant="main" size="main" disabled={false}>
            로그인하기
          </Button>
        </form>
      </Form>
    </div>
  );
};
