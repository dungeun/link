export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">도움말 센터</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">자주 묻는 질문</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Q. 인플루언서로 가입하려면?</h3>
                <p className="text-gray-600 text-sm mt-1">
                  회원가입 시 인플루언서를 선택하고 SNS 계정을 연동해주세요.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Q. 캠페인 등록은 어떻게?</h3>
                <p className="text-gray-600 text-sm mt-1">
                  비즈니스 계정으로 가입 후 사업자 인증을 받으면 캠페인을 등록할
                  수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">이용 가이드</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• 인플루언서 가입 가이드</li>
              <li>• 비즈니스 가입 가이드</li>
              <li>• 캠페인 등록 방법</li>
              <li>• 정산 시스템 안내</li>
              <li>• 콘텐츠 제출 방법</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">문의하기</h2>
            <p className="text-gray-600 mb-4">추가 도움이 필요하신가요?</p>
            <div className="space-y-2 text-sm">
              <p>📧 이메일: support@revu.one-q.xyz</p>
              <p>⏰ 운영시간: 평일 09:00 - 18:00</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">고객센터</h2>
            <p className="text-gray-600">
              긴급한 문의사항은 고객센터로 연락주세요.
            </p>
            <a
              href="/contact"
              className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            >
              문의하기
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
