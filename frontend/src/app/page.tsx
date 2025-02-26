import Link from 'next/link';
import Image from 'next/image';
import { PeoplefirstNeat } from './fonts';

import { Button } from '@/components/ui/button';

const WelcomePage = () => {
  return (
    <main
      className={`${PeoplefirstNeat.className} overflow-hidden max-w-md flex flex-col items-start m-auto`}
    >
      <div className="w-[227px] h-[140px] ml-7 mt-[110px] mb-[29px]">
        <Image
          src="/assets/꾸부기로고.png"
          alt="logo"
          width={227}
          height={140}
        ></Image>
      </div>
      <div className="w-[227px] h-[240px] text-left ml-7">
        <p className="text-[48px] leading-[1]">
          꾸부정한 자세를<br></br>꾸부기와 함께<br></br>바로 잡고<br></br>
          부기온앤온<br></br>가져와
        </p>
      </div>
      <div className="fixed translate-x-[40px] translate-y-[40px] top-[62%]">
        <Image
          src="/assets/메인말풍선.png"
          alt="로고"
          width={323}
          height={109}
        ></Image>
        <div className="relative bottom-[96px] left-[26px]">
          <p className="text-[32px] h-[42px]">야 너두 할 수 있어</p>
          <p className="text-[20px]">거북목을 극복한 나처럼</p>
        </div>
      </div>
      <div className="fixed scale-x-[-1] translate-x-[200px] -translate-y-[140px] top-[62%]">
        <Image
          src="/assets/bugi.png"
          alt="로고"
          width={317}
          height={310}
        ></Image>
      </div>
      
      <div className="fixed bottom-10 left-0 right-0 flex justify-center">
        <Link href="/main">
          <Button className="bg-gradient-to-r from-[#6B925C] to-[#9EB384] text-white px-8 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow">
            새로운 메인 페이지로 이동
          </Button>
        </Link>
      </div>
    </main>
  );
};

export default WelcomePage;
