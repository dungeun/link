'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Save, Globe, Upload } from 'lucide-react';

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
    title: '',
    subtitle: '',
    link: '',
    icon: '',
    backgroundColor: '#FEF3C7',
    textColor: '#000000',
    visible: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [sectionVisible, setSectionVisible] = useState(true);

  // DB에서 데이터 로드
  useEffect(() => {
    loadSection();
  }, []);

  const loadSection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ui-sections/promo');
      
      if (response.ok) {
        const data = await response.json();
        if (data.section) {
          // content 데이터를 promoBanner 상태로 설정
          if (data.section.content) {
            setPromoBanner({
              title: data.section.content.title || '',
              subtitle: data.section.content.subtitle || '',
              link: data.section.content.link || '',
              icon: data.section.content.icon || '',
              backgroundColor: data.section.content.backgroundColor || '#FEF3C7',
              textColor: data.section.content.textColor || '#000000',
              backgroundImage: data.section.content.backgroundImage || '',
              visible: true
            });
          }
          setSectionVisible(data.section.visible);
        }
      } else if (response.status === 404) {
        // 섹션이 없으면 기본 데이터로 초기화
        setPromoBanner({
          title: '첫 캠페인 수수료 0%',
          subtitle: '지금 시작하고 혜택을 받아보세요',
          link: '/register',
          icon: '🎉',
          backgroundColor: '#FEF3C7',
          textColor: '#000000',
          visible: true
        });
      } else {
        console.error('Failed to load section');
      }
    } catch (error) {
      console.error('Error loading section:', error);
      alert('섹션 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updates: Partial<PromoBanner>) => {
    setPromoBanner({ ...promoBanner, ...updates });
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        handleUpdate({ backgroundImage: data.url });
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ui-sections/promo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: promoBanner,
          visible: sectionVisible,
          autoTranslate // 자동 번역 옵션 전달
        })
      });

      if (response.ok) {
        alert('저장되었습니다.');
        router.push('/admin/ui-config?tab=sections');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving section:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/ui-config?tab=sections')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">프로모션 배너 관리</h1>
                <p className="text-sm text-gray-600 mt-1">메인 페이지에 표시되는 프로모션 배너를 관리합니다</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 자동 번역 토글 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  autoTranslate ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform mt-1 ${
                    autoTranslate ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </div>
                <span className="flex items-center gap-1 text-sm text-gray-700">
                  <Globe className="w-4 h-4" />
                  자동 번역
                </span>
              </label>

              {/* 섹션 표시 토글 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sectionVisible}
                  onChange={(e) => setSectionVisible(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  sectionVisible ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform mt-1 ${
                    sectionVisible ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </div>
                <span className="flex items-center gap-1 text-sm text-gray-700">
                  {sectionVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  섹션 표시
                </span>
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="프로모션 제목을 입력하세요"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="프로모션 부제목을 입력하세요"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      !promoBanner.icon ? 'bg-blue-50 border-blue-400' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    없음
                  </button>
                  {emojiOptions.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleUpdate({ icon: emoji })}
                      className={`w-12 h-12 border rounded-lg text-xl transition-colors ${
                        promoBanner.icon === emoji ? 'bg-blue-50 border-blue-400' : 'border-gray-300 hover:bg-gray-50'
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
                      className={`p-3 rounded-lg text-sm font-medium border-2 transition-colors ${
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배경 이미지 (선택사항)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="promo-image"
                  />
                  <label
                    htmlFor="promo-image"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    이미지 업로드
                  </label>
                  {promoBanner.backgroundImage && (
                    <button
                      onClick={() => handleUpdate({ backgroundImage: '' })}
                      className="text-red-600 text-sm hover:underline"
                    >
                      이미지 제거
                    </button>
                  )}
                </div>
                {promoBanner.backgroundImage && (
                  <p className="text-xs text-gray-500 mt-1">이미지가 설정되면 배경색은 무시됩니다</p>
                )}
              </div>
            </div>

            {/* 미리보기 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  데스크탑 미리보기
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
                        {promoBanner.title || '제목을 입력하세요'}
                      </h3>
                      <p style={{ 
                        color: promoBanner.backgroundImage ? '#FFFFFF' : promoBanner.textColor,
                        opacity: promoBanner.backgroundImage ? 0.9 : 0.8
                      }}>
                        {promoBanner.subtitle || '부제목을 입력하세요'}
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
              </div>

              {/* 모바일 미리보기 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  모바일 미리보기
                </label>
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
                            {promoBanner.title || '제목을 입력하세요'}
                          </h3>
                          <p className="text-sm"
                            style={{ 
                              color: promoBanner.backgroundImage ? '#FFFFFF' : promoBanner.textColor,
                              opacity: promoBanner.backgroundImage ? 0.9 : 0.8
                            }}
                          >
                            {promoBanner.subtitle || '부제목을 입력하세요'}
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

        {/* 안내 메시지 */}
        {autoTranslate && (
          <div className="mt-8 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 자동 번역 활성화됨:</strong> 저장 시 입력한 한글 제목과 부제목이 자동으로 영어와 일본어로 번역됩니다. 이모지는 그대로 유지됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}