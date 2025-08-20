export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">채용</h1>
        <p className="text-gray-600 mb-8">
          LinkPick Platform과 함께 성장할 인재를 찾고 있습니다.
        </p>
        <div className="bg-white rounded-lg shadow-sm p-8 text-left">
          <h2 className="text-xl font-semibold mb-4">현재 채용 중인 포지션</h2>
          <p className="text-gray-600 mb-6">
            현재 진행 중인 채용 공고가 없습니다.
          </p>
          <p className="text-gray-600">
            인재풀 등록을 원하시면 support@linkpick.com로 이력서를 보내주세요.
          </p>
        </div>
        <a 
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}