export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">문의하기</h1>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">고객센터</h2>
              <p className="text-gray-600">
                평일 09:00 - 18:00 (주말 및 공휴일 휴무)
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">이메일 문의</h2>
              <p className="text-gray-600">support@revu.one-q.xyz</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">자주 묻는 질문</h2>
              <p className="text-gray-600">
                문의하시기 전에 FAQ를 확인해보세요.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
