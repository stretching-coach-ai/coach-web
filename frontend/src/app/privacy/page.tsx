'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fnb } from '@/components/Fnb';
import { StardustBold } from '../fonts';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
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
            <h1 className={`${StardustBold.className} text-[#689700] text-xl`}>개인정보처리방침</h1>
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
        
        {/* 개인정보처리방침 내용 */}
        <div className="prose prose-sm max-w-none text-gray-700">
          <p className="font-bold text-lg mb-4">꾸부기 개인정보처리방침</p>
          <p className="mb-2">최종 수정일: 2024년 2월 27일</p>
          
          <div className="mt-6">
            <h2 className="text-base font-bold mb-2">1. 개인정보의 처리 목적</h2>
            <p className="mb-4">
              꾸부기(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리하고 있으며, 다음의 목적 이외의 용도로는 이용하지 않습니다.
            </p>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정이용 방지와 비인가 사용 방지, 가입의사 확인, 연령확인, 만14세 미만 아동 개인정보 수집 시 법정대리인 동의여부 확인, 불만처리 등 민원처리, 고지사항 전달</li>
              <li>서비스 제공: AI 스트레칭 코치 서비스 제공, 맞춤형 스트레칭 추천, 콘텐츠 제공, 서비스 이용 기록과 접속 빈도 분석, 서비스 이용에 대한 통계</li>
              <li>마케팅 및 광고에의 활용: 신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 서비스의 유효성 확인, 접속빈도 파악, 회원의 서비스 이용에 대한 통계</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">2. 개인정보의 처리 및 보유 기간</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
              <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                <ul className="list-disc pl-5 mt-1 mb-2">
                  <li>회원 가입 및 관리: 회원 탈퇴 시까지</li>
                  <li>다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지</li>
                  <li>관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지</li>
                  <li>서비스 이용에 따른 채권·채무관계 잔존 시에는 해당 채권·채무관계 정산 시까지</li>
                </ul>
              </li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">3. 개인정보의 제3자 제공</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</li>
              <li>회사는 현재 이용자의 개인정보를 제3자에게 제공하고 있지 않습니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">4. 개인정보처리 위탁</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
                <ul className="list-disc pl-5 mt-1 mb-2">
                  <li>클라우드 서비스: AWS (Amazon Web Services)</li>
                  <li>이메일 발송 서비스: SendGrid</li>
                </ul>
              </li>
              <li>회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">5. 정보주체와 법정대리인의 권리·의무 및 그 행사방법</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.</li>
              <li>제1항에 따른 권리 행사는 회사에 대해 개인정보 보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</li>
              <li>제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 개인정보 보호법 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.</li>
              <li>개인정보 열람 및 처리정지 요구는 개인정보보호법 제35조 제4항, 제37조 제2항에 의하여 정보주체의 권리가 제한 될 수 있습니다.</li>
              <li>개인정보의 정정 및 삭제 요구는 다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 그 삭제를 요구할 수 없습니다.</li>
              <li>회사는 정보주체 권리에 따른 열람의 요구, 정정·삭제의 요구, 처리정지의 요구 시 열람 등 요구를 한 자가 본인이거나 정당한 대리인인지를 확인합니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">6. 개인정보의 파기</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
              <li>정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</li>
              <li>개인정보 파기의 절차 및 방법은 다음과 같습니다.
                <ul className="list-disc pl-5 mt-1 mb-2">
                  <li>파기절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                  <li>파기방법: 회사는 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>
                </ul>
              </li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">7. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
              <li>쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.</li>
              <li>이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 이용자는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">8. 개인정보 보호책임자</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                <ul className="list-disc pl-5 mt-1 mb-2">
                  <li>개인정보 보호책임자: 꾸부기 개발팀</li>
                  <li>이메일: privacy@kkubugi.com</li>
                </ul>
              </li>
              <li>정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.</li>
            </ol>
            
            <h2 className="text-base font-bold mb-2">9. 개인정보 처리방침 변경</h2>
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              <li>이 개인정보처리방침은 2024년 2월 27일부터 적용됩니다.</li>
              <li>이전의 개인정보 처리방침은 해당 정보가 없습니다(최초 제정).</li>
            </ol>
            
            <p className="mt-8 text-center">
              부칙<br />
              이 개인정보처리방침은 2024년 2월 27일부터 시행합니다.
            </p>
          </div>
        </div>
      </div>
      
      {/* 하단 네비게이션 */}
      <Fnb />
    </main>
  );
};

export default PrivacyPage; 