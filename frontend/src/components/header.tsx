import Image from 'next/image';

interface Props {
  title: string;
}

export const Header = ({ title }: Props) => {
  return (
    <div className="flex items-end gap-2">
      <Image
        src="/assets/bugi-head.png"
        alt="메인 캐릭터 부기 이미지"
        width={50}
        height={40}
      />
      <div>
        <p className="w-fit text-sm bg-[#D8FF7F] py-2 px-3 rounded-md rounded-bl-none">
          {title}
        </p>
      </div>
    </div>
  );
};
