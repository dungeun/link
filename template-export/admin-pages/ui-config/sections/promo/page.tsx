'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface PromoBanner {
  title: string;
  subtitle: string;
  link?: string;
  icon?: string;
  backgroundImage?: string;
  backgroundColor: string;
  textColor: string;
  visible: boolean;
}

export default function PromoSectionEditPage() {
  const router = useRouter();
  const [promoBanner, setPromoBanner] = useState<PromoBanner>({
    title: '첫 캠페인 수수료 0%',
    subtitle: '지금 시작하고 혜택을 받아보세요',
    link: '/register',
    icon: '🎉',
    backgroundColor: '#FEF3C7',
    textColor: '#000000',
    visible: true
  });
  const [saving, setSaving] = useState(false);

  const handleUpdate = (updates: Partial<PromoBanner>) => {
    setPromoBanner({ ...promoBanner, ...updates });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('저장되었습니다.');
      router.push('/admin/ui-config?tab=sections');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const presetBackgrounds = [
    { name: '노란색', value: '#FEF3C7', textColor: '#000000' },
    { name: '파란색', value: '#DBEAFE', textColor: '#000000' },
    { name: '초록색', value: '#D1FAE5', textColor: '#000000' },
    { name: '보라색', value: '#E9D5FF', textColor: '#000000' },
    { name: '빨간색', value: '#FEE2E2', textColor: '#000000' },
    { name: '검은색', value: '#1F2937', textColor: '#FFFFFF' },
  ];

  const emojiOptions = ['🎉', '🎁', '🚀', '💎', '⭐', '🔥', '💰', '🎯', '📢', '✨'];

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
        <h1 className="text-2xl font-bold text-gray-900">프로모션 배너 관리</h1>
        <p className="text-gray-600 mt-2">메인 페이지에 표시되는 프로모션 배너를 관리합니다.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">배너 설정</h2>
          <button
            onClick={() => handleUpdate({ visible: !promoBanner.visible })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              promoBanner.visible 
                ? 'bg-green-50 text-green-700 border-green-300' 
                : 'bg-gray-50 text-gray-700 border-gray-300'
            }`}
          >
            {promoBanner.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{promoBanner.visible ? '표시중' : '숨김'}</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={promoBanner.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부제목
              </label>
              <input
                type="text"
                value={promoBanner.subtitle}
                onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                링크 (선택사항)
              </label>
              <input
                type="text"
                value={promoBanner.link || ''}
                onChange={(e) => handleUpdate({ link: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="/campaigns"
              />
              <p className="text-xs text-gray-500 mt-1">링크가 있으면 클릭 가능한 배너가 됩니다</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                아이콘 (선택사항)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdate({ icon: '' })}
                  className={`px-4 py-2 border rounded ${
                    !promoBanner.icon ? 'bg-gray-100 border-gray-400' : 'border-gray-300'
                  }`}
                >
                  없음
                </button>
                {emojiOptions.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleUpdate({ icon: emoji })}
                    className={`w-12 h-12 border rounded text-xl ${
                      promoBanner.icon === emoji ? 'bg-blue-100 border-blue-400' : 'border-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배경색
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presetBackgrounds.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => handleUpdate({ 
                      backgroundColor: bg.value, 
                      textColor: bg.textColor,
                      backgroundImage: '' 
                    })}
                    className={`p-3 rounded-lg text-sm font-medium border-2 ${
                      promoBanner.backgroundColor === bg.value && !promoBanner.backgroundImage
                        ? 'border-blue-400' 
                        : 'border-transparent'
                    }`}
                    style={{ 
                      backgroundColor: bg.value, 
                      color: bg.textColor 
                    }}
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={promoBanner.backgroundColor}
                  onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                  className="h-10 w-20"
                />
                <input
                  type="text"
                  value={promoBanner.backgroundColor}
                  onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배경 이미지 URL (선택사항)
              </label>
              <input
                type="text"
                value={promoBanner.backgroundImage || ''}
                onChange={(e) => handleUpdate({ backgroundImage: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/banner-bg.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">이미지를 설정하면 배경색은 무시됩니다</p>
            </div>
          </div>

          {/* 미리보기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              미리보기
            </label>
            <div 
              className="rounded-2xl p-6 relative overflow-hidden cursor-pointer group"
              style={{
                backgroundImage: promoBanner.backgroundImage 
                  ? `url(${promoBanner.backgroundImage})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: !promoBanner.backgroundImage 
                  ? promoBanner.backgroundColor
                  : undefined
              }}
            >
              <div className={`flex items-center justify-between ${
                promoBanner.backgroundImage ? 'relative z-10' : ''
              }`}>
                {promoBanner.backgroundImage && (
                  <div className="absolute inset-0 bg-black/20 -z-10" />
                )}
                <div>
                  <h3 className={`text-xl font-bold mb-1`}
                    style={{ 
                      color: promoBanner.backgroundImage ? '#FFFFFF' : promoBanner.textColor 
                    }}
                  >
                    {promoBanner.title}
                  </h3>
                  <p style={{ 
                    color: promoBanner.backgroundImage ? '#FFFFFF' : promoBanner.textColor,
                    opacity: promoBanner.backgroundImage ? 0.9 : 0.8
                  }}>
                    {promoBanner.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {promoBanner.icon && (
                    <span className="text-5xl">{promoBanner.icon}</span>
                  )}
                  {promoBanner.link && (
                    <svg className="w-6 h-6 opacity-50 group-hover:opacity-100 transition" 
                      fill="none" 
                      stroke={promoBanner.backgroundImage ? '#FFFFFF' : promoBanner.textColor} 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* 모바일 미리보기 */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">모바일 미리보기</p>
              <div className="max-w-sm mx-auto">
                <div 
                  className="rounded-xl p-4 relative overflow-hidden"
                  style={{
                    backgroundImage: promoBanner.backgroundImage 
                      ? `url(${promoBanner.backgroundImage})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: !promoBanner.backgroundImage 
                      ? promoBanner.backgroundColor
                      : undefined
                  }}
                >
                  <div className={`${promoBanner.backgroundImage ? 'relative z-10' : ''}`}>
                    {promoBanner.backgroundImage && (
                      <div className="absolute inset-0 bg-black/20 -z-10" />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold"
                          style={{ 
                            color: promoBanner.backgroundImage ? '#FFFFFF' : promoBanner.textColor 
                          }}
                        >
                          {promoBanner.title}
                        </h3>
                        <p className="text-sm"
                          style={{ 
                            color: promoBanner.backgroundImage ? '#FFFFFF' : promoBanner.textColor,
                            opacity: promoBanner.backgroundImage ? 0.9 : 0.8
                          }}
                        >
                          {promoBanner.subtitle}
                        </p>
                      </div>
                      {promoBanner.icon && (
                        <span className="text-3xl ml-3">{promoBanner.icon}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 rounded-lg ${
            saving 
              ? 'bg-gray-400 text-gray-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}