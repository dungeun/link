'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function NewSectionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'hero',
    title: '',
    subtitle: '',
    content: '',
    buttonText: '',
    buttonLink: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    layout: 'center',
    imageUrl: '',
    visible: true
  });

  const sectionTypes = [
    { value: 'hero', label: '히어로 배너', description: '메인 비주얼과 CTA가 있는 대형 배너' },
    { value: 'features', label: '기능 소개', description: '서비스의 주요 기능을 카드 형태로 표시' },
    { value: 'stats', label: '통계', description: '숫자로 보여주는 성과 지표' },
    { value: 'testimonials', label: '고객 후기', description: '고객의 추천사나 리뷰 표시' },
    { value: 'cta', label: 'CTA', description: '행동 유도 버튼이 있는 간단한 섹션' },
    { value: 'content', label: '콘텐츠', description: '텍스트와 이미지를 자유롭게 배치' },
    { value: 'gallery', label: '갤러리', description: '이미지 갤러리 형태' },
    { value: 'faq', label: 'FAQ', description: '자주 묻는 질문과 답변' }
  ];

  const layoutOptions = [
    { value: 'center', label: '중앙 정렬' },
    { value: 'left', label: '왼쪽 정렬' },
    { value: 'right', label: '오른쪽 정렬' },
    { value: 'split', label: '분할 레이아웃' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/ui-config/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/admin/ui-config?tab=sections');
      } else {
        alert('섹션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('섹션 생성 오류:', error);
      alert('섹션 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로 가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">새 섹션 생성</h1>
        <p className="text-gray-600 mt-2">홈페이지에 표시될 새로운 섹션을 만듭니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 섹션 타입 선택 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">섹션 타입</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {sectionTypes.map((type) => (
              <label
                key={type.value}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="sr-only"
                />
                <div>
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="섹션 제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              부제목
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="부제목을 입력하세요 (선택사항)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="섹션 내용을 입력하세요"
            />
          </div>
        </div>

        {/* CTA 버튼 설정 */}
        {(formData.type === 'hero' || formData.type === 'cta') && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-4">CTA 버튼</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                버튼 텍스트
              </label>
              <input
                type="text"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 지금 시작하기"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                버튼 링크
              </label>
              <input
                type="text"
                value={formData.buttonLink}
                onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/register"
              />
            </div>
          </div>
        )}

        {/* 디자인 설정 */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">디자인 설정</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              레이아웃
            </label>
            <select
              value={formData.layout}
              onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {layoutOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배경색
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="h-10 w-20"
                />
                <input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                텍스트색
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="h-10 w-20"
                />
                <input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 URL (선택사항)
            </label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">섹션 표시</span>
            </label>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">미리보기</h2>
          <div 
            className="border rounded-lg p-8"
            style={{ 
              backgroundColor: formData.backgroundColor, 
              color: formData.textColor,
              textAlign: formData.layout as any
            }}
          >
            <h3 className="text-2xl font-bold mb-2">{formData.title || '제목이 여기 표시됩니다'}</h3>
            {formData.subtitle && <p className="text-lg mb-4">{formData.subtitle}</p>}
            {formData.content && <p className="mb-4">{formData.content}</p>}
            {formData.buttonText && (
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {formData.buttonText}
              </button>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            섹션 생성
          </button>
        </div>
      </form>
    </div>
  );
}