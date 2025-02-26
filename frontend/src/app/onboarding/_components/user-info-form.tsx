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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Stardust } from '@/app/fonts';

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
  gender: z.enum(['female', 'male'], {
    required_error: '성별 알려달라부기',
  }),
});

type Props = {
  onDotButtonClick: (index: number) => void;
};
export const UserInfoForm = ({ onDotButtonClick }: Props) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      age: '',
      job: '',
      dailyRoutine: '',
      gender: 'female',
    },
    mode: 'onChange',
  });

  const onSubmit = (values: z.infer<typeof FormSchema>) => {
    console.log(values);
    if (localStorage.getItem('userInfo')) {
      localStorage.removeItem('userInfo');
    }
    localStorage.setItem('userInfo', JSON.stringify(values));
    onDotButtonClick(1);
  };

  return (
    <div className={`${Stardust.className} mt-9 w-[390px] m-auto`}>
      <Header title="본인 정보를<br />입력해라부기" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-[30px]">
          <div className="space-y-9 w-[339px]">
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
                  <FormMessage className="text-[#9EBC5A]" />
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
                  <FormMessage className="text-[#9EBC5A]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="female" />
                        </FormControl>
                        <FormLabel>여자</FormLabel>
                      </FormItem>
                      <div className='mx-1 after:content-["|"] text-[#93D400]'></div>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="male" />
                        </FormControl>
                        <FormLabel>남자</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage className="text-[#9EBC5A]" />
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
                      className={cn(
                        'resize-none pt-7',
                        field.value && 'bg-[#F7FFE5]',
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[#9EBC5A]" />
                  <FormDescription>
                    하루 일상 루틴, 습관, 질병 이력
                    <br /> 너의 상태를 자세히 알려주면, 너에 맞는 스트레칭을
                    추천할 수 있다부기!
                  </FormDescription>
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
              // onClick={() => onDotButtonClick(1)}
            >
              다 입력했어요
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
