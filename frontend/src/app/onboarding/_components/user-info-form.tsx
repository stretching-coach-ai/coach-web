'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const isNumberRegex = /^[0-9]*$/;
const FormSchema = z.object({
  age: z
    .string()
    .regex(isNumberRegex, { message: '숫자만 써달라부기!' })
    .min(1, { message: '나이 알려주라부기 ' })
    .max(3, { message: '우리 할머니보다 연세 많다부기..' }),
  job: z
    .string()
    .min(1, { message: '가족이 돼주라 내 집이 돼주라 직업 알려주라부기.' })
    .max(20, { message: '20자 이내로 써달라부기' }),
  dailyRoutine: z.string().min(10, { message: '조금 더 알려주라부기..' }),
});

export const UserInfoForm = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      age: '',
      job: '',
      dailyRoutine: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (values: z.infer<typeof FormSchema>) => {
    console.log(values);
  };

  return (
    <div className="max-w-md flex flex-col items-start m-auto">
      <Header title="본인 정보를 입력해라부기" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-[30px] space-y-9"
        >
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem className="relative h-[63px]">
                <FormLabel className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-md">
                  나이
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={false}
                    className={cn(field.value && 'bg-[#F7FFE5]')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="job"
            render={({ field }) => (
              <FormItem className="relative h-[63px]">
                <FormLabel className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-md">
                  직업
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={false}
                    className={cn(field.value && 'bg-[#F7FFE5]')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dailyRoutine"
            render={({ field }) => (
              <FormItem className="relative h-fit">
                <FormLabel className="absolute left-3 top-2 text-muted-foreground text-md">
                  생활패턴
                </FormLabel>
                <FormControl>
                  <Textarea
                    className={cn('resize-none', field.value && 'bg-[#F7FFE5]')}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  하루 일상 루틴, 습관, 질병 이력등 너의 상태를 자세히 알려주면
                  <br /> 너에 맞는 스트레칭을 추천할 수 있다부기!
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            variant="main"
            size="main"
            // disabled={
            //   !form.watch('age') ||
            //   !form.watch('job') ||
            //   !form.watch('dailyRoutine')
            // }
            disabled={!form.formState.isValid}
          >
            다 입력했어요
          </Button>
        </form>
      </Form>
    </div>
  );
};
