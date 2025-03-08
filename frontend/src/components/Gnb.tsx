import Image from 'next/image';
import { usePathname } from 'next/navigation';

export const Gnb = () => {
  const pathname = usePathname();
  const isKkubugiPage = pathname === '/kkubugi';

  return (
    <header className="max-w-md w-full h-[72px] fixed bg-[#F9FFEB] z-50 left-0 right-0 m-auto">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="w-fit">
          <Image
            src="/assets/꾸부기로고.png"
            alt="logo"
            width={82}
            height={51}
            priority={true}
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        {isKkubugiPage && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#83A760] rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-md font-bold">꾸</span>
            </div>
            <h1 className="text-[#3E4D2F] text-md font-bold">꾸부기와 대화하기</h1>
          </div>
        )}
        {!isKkubugiPage && pathname !== '/' && (
          <div className="flex items-center">
            <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm">
              <h1 className="text-[#3E4D2F] text-sm font-medium">{getPageTitle(pathname)}</h1>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Helper function to get page title based on pathname
const getPageTitle = (pathname: string): string => {
  if (pathname.includes('/history')) return '스트레칭 기록';
  if (pathname.includes('/more')) return '더보기';
  if (pathname.includes('/onboarding')) return '온보딩';
  if (pathname.includes('/select')) return '부위 선택';
  if (pathname.includes('/main')) return '메인';
  return '';
};
