'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { StardustBold } from '../fonts';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  const router = useRouter();

  return (
    <main className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
      <div className="bg-white rounded-xl shadow-sm mx-2 my-3 p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="mr-3 p-1"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className={`${StardustBold.className} text-[#689700] text-xl`}>이용약관</h1>
          </div>
          <div className="w-10 h-10">
            <Image
              src="/assets/bugi.png"
              alt="부기 캐릭터"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
        
        {/* 이용약관 내용 */}
        <div className="prose prose-sm max-w-none text-gray-700">
          <p className="font-bold text-lg mb-4">꾸부기 서비스 이용약관</p>
          <p className="mb-2">최종 수정일: 2024년 2월 27일</p>
          
          <div className="mt-6">
            <h2 className="text-base font-bold mb-2">제1조 (목적)</h2>
            <p className="mb-4">
              이 약관은 꾸부기(이하 "회사")가 제공하는 AI 스트레칭 코치 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
            
            <h2 className="text-base font-bold mb-2">제2조 (정의)</h2>
            <p className="mb-2">이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>"서비스"란 회사가 제공하는 AI 기반 스트레칭 코치 서비스를 의미합니다.</li>
              <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
              <li>"회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 서비스를 지속적으로 이용할 수 있는 자를 말합니다.</li>
              <li>"비회원"이란 회원으로 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제3조 (약관의 게시와 개정)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</li>
              <li>회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</li>
              <li>회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
              <li>이용자는 개정된 약관에 동의하지 않을 경우 회원 탈퇴를 요청할 수 있으며, 개정된 약관의 효력 발생일 이후에도 서비스를 계속 사용할 경우 약관의 변경사항에 동의한 것으로 간주됩니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제4조 (서비스의 제공 및 변경)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 다음과 같은 서비스를 제공합니다.
                <ul className="list-disc pl-5 mt-1 mb-2">
                  <li>AI 기반 맞춤형 스트레칭 가이드 제공</li>
                  <li>부위별 스트레칭 정보 제공</li>
                  <li>스트레칭 활동 기록 및 관리</li>
                  <li>건강 정보 제공</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ul>
              </li>
              <li>회사는 서비스의 품질 향상을 위해 서비스의 내용을 변경할 수 있으며, 이 경우 변경된 서비스의 내용 및 제공일자를 명시하여 현행 서비스 내용과 함께 서비스 화면에 공지합니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제5조 (서비스 이용시간)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>서비스는 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</li>
              <li>회사는 서비스의 제공에 필요한 경우 정기점검을 실시할 수 있으며, 정기점검시간은 서비스 제공화면에 공지한 바에 따릅니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제6조 (이용계약의 성립)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>이용계약은 이용자가 이 약관에 동의하고, 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 가입완료 버튼을 누르면 회사가 이를 승낙함으로써 체결됩니다.</li>
              <li>회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않을 수 있습니다.
                <ul className="list-disc pl-5 mt-1 mb-2">
                  <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                  <li>허위의 정보를 기재하거나, 회사가 요구하는 정보를 제공하지 않은 경우</li>
                  <li>만 14세 미만 아동이 법정대리인(부모 등)의 동의를 얻지 않은 경우</li>
                  <li>이전에 이용약관 위반 등의 사유로 서비스 이용이 제한된 적이 있는 경우</li>
                </ul>
              </li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제7조 (개인정보보호)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 관련법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.</li>
              <li>개인정보의 보호 및 사용에 대해서는 관련법령 및 회사의 개인정보처리방침이 적용됩니다.</li>
              <li>회사는 서비스 제공과 관련하여 취득한 회원의 개인정보를 본인의 승낙 없이 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
                <ul className="list-disc pl-5 mt-1 mb-2">
                  <li>법령에 의해 제공이 요구되는 경우</li>
                  <li>서비스 제공에 따른 요금정산을 위하여 필요한 경우</li>
                  <li>통계작성, 학술연구 또는 시장조사를 위하여 필요한 경우로서 특정 개인을 식별할 수 없는 형태로 제공되는 경우</li>
                </ul>
              </li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제8조 (이용자의 의무)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>이용자는 다음 행위를 하여서는 안 됩니다.
                <ul className="list-disc pl-5 mt-1 mb-2">
                  <li>신청 또는 변경 시 허위내용의 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>회사가 게시한 정보의 변경</li>
                  <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                  <li>기타 불법적이거나 부당한 행위</li>
                </ul>
              </li>
              <li>이용자는 관계법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제9조 (서비스 이용제한)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 이용자가 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 서비스 이용을 제한할 수 있습니다.</li>
              <li>회사는 전항에도 불구하고, 주민등록법을 위반한 명의도용 및 결제도용, 저작권법을 위반한 불법프로그램의 제공 및 운영방해, 정보통신망법을 위반한 불법통신 및 해킹, 악성프로그램의 배포, 접속권한 초과행위 등과 같이 관련법을 위반한 경우에는 즉시 영구이용정지를 할 수 있습니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제10조 (책임제한)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖에 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 게재한 정보, 자료, 사실의 신뢰도, 정확성 등 내용에 관하여는 책임을 지지 않습니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">제11조 (준거법 및 재판관할)</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사와 이용자 간 제기된 소송은 대한민국법을 준거법으로 합니다.</li>
              <li>회사와 이용자 간 발생한 분쟁에 관한 소송은 민사소송법 상의 관할법원에 제소합니다.</li>
            </ol>
            
            <p className="mt-8 text-center">
              부칙<br />
              이 약관은 2024년 2월 27일부터 시행합니다.
            </p>
          </div>
        </div>
      </div>
      
      {/* 하단 네비게이션 */}
      <Fnb />
    </main>
  );
};

export default TermsPage; 