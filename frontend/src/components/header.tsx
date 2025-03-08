import Image from 'next/image';
import { Stardust } from '@/app/fonts';

interface Props {
  title: string;
}

export const Header = ({ title }: Props) => {
  return (
    <div className="flex items-end gap-2 w-full max-w-[339px] mx-auto">
      <Image
        src="/assets/bugi-head.png"
        alt="메인 캐릭터 부기 이미지"
        width={50}
        height={40}
        priority={true}
        style={{ width: 'auto', height: 'auto' }}
      />
      <div
        className={`${Stardust.className} text-[24px] border-b-[2px] border-b-[#93D400]`}
      >
        {title.split('<br />').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
};
