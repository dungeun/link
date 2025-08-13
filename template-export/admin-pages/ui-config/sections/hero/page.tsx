'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Upload } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  tag?: string;
  link?: string;
  bgColor: string;
  backgroundImage?: string;
  visible: boolean;
  order: number;
  useFullImage?: boolean;
  fullImageUrl?: string;
  fullImageFile?: File;
  backgroundImageFile?: File;
}

export default function HeroSectionEditPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>([
    {
      id: '1',
      title: '인플루언서 마케팅의\n새로운 기준',
      subtitle: '투명하고 신뢰할 수 있는 캠페인 매칭 플랫폼',
      tag: 'NEW',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-purple-600',
      visible: true,
      order: 1
    },
    {
      id: '2',
      title: '월 100만원 더 벌기',
      subtitle: '나에게 맞는 캠페인을 찾아 수익을 올려보세요',
      bgColor: 'bg-gradient-to-br from-pink-500 to-rose-500',
      visible: true,
      order: 2
    }
  ]);
  const [saving, setSaving] = useState(false);

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: Date.now().toString(),
      title: '새 슬라이드',
      subtitle: '부제목을 입력하세요',
      bgColor: 'bg-gradient-to-br from-blue-600 to-cyan-600',
      visible: true,
      order: slides.length + 1
    };
    setSlides([...slides, newSlide]);
  };

  const handleUpdateSlide = (id: string, updates: Partial<HeroSlide>) => {
    setSlides(slides.map(slide => 
      slide.id === id ? { ...slide, ...updates } : slide
    ));
  };

  const handleImageUpload = (slideId: string, file: File, type: 'full' | 'background') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      if (type === 'full') {
        handleUpdateSlide(slideId, { fullImageUrl: imageUrl, fullImageFile: file });
      } else {
        handleUpdateSlide(slideId, { backgroundImage: imageUrl, backgroundImageFile: file });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      alert('최소 1개의 슬라이드는 필요합니다.');
      return;
    }
    setSlides(slides.filter(slide => slide.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // API 호출 로직
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('저장되었습니다.');
      router.push('/admin/ui-config?tab=sections');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const presetColors = [
    { name: '인디고-퍼플', value: 'bg-gradient-to-br from-indigo-600 to-purple-600' },
    { name: '핑크-로즈', value: 'bg-gradient-to-br from-pink-500 to-rose-500' },
    { name: '블루-시안', value: 'bg-gradient-to-br from-blue-600 to-cyan-600' },
    { name: '그린-에메랄드', value: 'bg-gradient-to-br from-green-600 to-emerald-600' },
    { name: '오렌지-레드', value: 'bg-gradient-to-br from-orange-500 to-red-500' },
    { name: '퍼플-핑크', value: 'bg-gradient-to-br from-purple-600 to-pink-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로 가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">히어로 배너 관리</h1>
        <p className="text-gray-600 mt-2">메인 페이지 상단에 표시되는 배너를 관리합니다.</p>
      </div>

      {/* 슬라이드 목록 */}
      <div className="space-y-6">
        {slides.map((slide, index) => (
          <div key={slide.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">슬라이드 {index + 1}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdateSlide(slide.id, { visible: !slide.visible })}
                  className={`p-2 rounded ${slide.visible ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {slide.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 입력 필드 */}
              <div className="space-y-4">
                {/* 전체 이미지 사용 토글 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={slide.useFullImage || false}
                      onChange={(e) => handleUpdateSlide(slide.id, { useFullImage: e.target.checked })}
                      className="mr-3 h-4 w-4 text-blue-600 rounded"
                    />
                    <div>
                      <span className="font-medium text-gray-900">전체 이미지 배너 사용</span>
                      <p className="text-sm text-gray-600">텍스트 대신 이미지 하나로 배너를 구성합니다</p>
                    </div>
                  </label>
                </div>

                {slide.useFullImage ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        배너 이미지 업로드 <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor={`full-image-upload-${slide.id}`}
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>파일 선택</span>
                              <input
                                id={`full-image-upload-${slide.id}`}
                                name={`full-image-upload-${slide.id}`}
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(slide.id, file, 'full');
                                  }
                                }}
                              />
                            </label>
                            <p className="pl-1">또는 드래그 앤 드롭</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF 최대 10MB</p>
                          <p className="text-xs text-gray-500">권장 크기: 1200x400px</p>
                        </div>
                      </div>
                      {slide.fullImageUrl && (
                        <div className="mt-2">
                          <img 
                            src={slide.fullImageUrl} 
                            alt="업로드된 배너"
                            className="h-20 rounded border"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        링크 (선택사항)
                      </label>
                      <input
                        type="text"
                        value={slide.link || ''}
                        onChange={(e) => handleUpdateSlide(slide.id, { link: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="/campaigns"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목 (줄바꿈은 \n 사용)
                      </label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(slide.id, { title: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        부제목
                      </label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => handleUpdateSlide(slide.id, { subtitle: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        태그 (선택사항)
                      </label>
                      <input
                        type="text"
                        value={slide.tag || ''}
                        onChange={(e) => handleUpdateSlide(slide.id, { tag: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="예: NEW, HOT"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        링크 (선택사항)
                      </label>
                      <input
                        type="text"
                        value={slide.link || ''}
                        onChange={(e) => handleUpdateSlide(slide.id, { link: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="/campaigns"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        배경색
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {presetColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleUpdateSlide(slide.id, { bgColor: color.value })}
                            className={`p-3 rounded-lg ${color.value} text-white text-xs font-medium ${
                              slide.bgColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                            }`}
                          >
                            {color.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        배경 이미지 업로드 (선택사항)
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor={`bg-image-upload-${slide.id}`}
                              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>파일 선택</span>
                              <input
                                id={`bg-image-upload-${slide.id}`}
                                name={`bg-image-upload-${slide.id}`}
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(slide.id, file, 'background');
                                  }
                                }}
                              />
                            </label>
                            <p className="pl-1">또는 드래그 앤 드롭</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF 최대 10MB</p>
                        </div>
                      </div>
                      {slide.backgroundImage && (
                        <div className="mt-2">
                          <img 
                            src={slide.backgroundImage} 
                            alt="업로드된 배경"
                            className="h-20 rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 미리보기 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  미리보기
                </label>
                {slide.useFullImage ? (
                  <div className="rounded-lg overflow-hidden h-48 bg-gray-100 relative">
                    {slide.fullImageUrl ? (
                      <img 
                        src={slide.fullImageUrl} 
                        alt="배너 미리보기"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">이미지 URL을 입력하세요</p>
                        </div>
                      </div>
                    )}
                    {slide.link && (
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition cursor-pointer" />
                    )}
                  </div>
                ) : (
                  <div
                    className={`${slide.bgColor} text-white p-6 rounded-lg h-48 flex flex-col justify-center`}
                    style={{
                      backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className={slide.backgroundImage ? 'bg-black/30 p-4 rounded' : ''}>
                      {slide.tag && (
                        <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium mb-2">
                          {slide.tag}
                        </span>
                      )}
                      <h2 className="text-2xl font-bold mb-2 whitespace-pre-line">
                        {slide.title}
                      </h2>
                      <p className="opacity-90">{slide.subtitle}</p>
                      {slide.link && !slide.backgroundImage && (
                        <span className="inline-block mt-4 bg-white/20 backdrop-blur border border-white/30 px-4 py-2 rounded-full text-sm">
                          자세히 보기 →
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 슬라이드 추가 버튼 */}
      <button
        onClick={handleAddSlide}
        className="w-full mt-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
      >
        <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <span className="text-gray-600">새 슬라이드 추가</span>
      </button>

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