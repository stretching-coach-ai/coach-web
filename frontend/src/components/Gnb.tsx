import Image from 'next/image';

export const Gnb = () => {
  return (
    <header className="w-full h-[72px] fixed bg-[#F9FFEB] z-50">
      <div className="w-fit mt-3 ml-4">
        <Image
          src="/assets/꾸부기로고.png"
          alt="logo"
          width={82}
          height={51}
        ></Image>
      </div>
    </header>
  );
};
