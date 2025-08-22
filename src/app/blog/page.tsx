export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">블로그</h1>
        <p className="text-gray-600 mb-8">
          준비 중인 페이지입니다. 곧 유용한 마케팅 인사이트와 팁을 제공할
          예정입니다.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}
