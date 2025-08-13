'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface RecommendedSection {
  title: string;
  subtitle?: string;
  visible: boolean;
  count: number;
  selectionMode: 'auto' | 'manual';
  autoFilter?: {
    category?: string;
    minBudget?: number;
    platform?: string;
  };
  manualCampaignIds?: string[];
}

export default function RecommendedSectionEditPage() {
  const router = useRouter();
  const [recommendedSection, setRecommendedSection] = useState<RecommendedSection>({
    title: '추천 캠페인',
    subtitle: '지금 주목할만한 캠페인을 만나보세요',
    visible: true,
    count: 10,
    selectionMode: 'auto',
    autoFilter: {}
  });
  const [saving, setSaving] = useState(false);

  const handleUpdate = (updates: Partial<RecommendedSection>) => {
    setRecommendedSection({ ...recommendedSection, ...updates });
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

  const categories = [
    { id: '', name: '전체' },
    { id: 'beauty', name: '뷰티' },
    { id: 'fashion', name: '패션' },
    { id: 'food', name: '맛집' },
    { id: 'travel', name: '여행' },
    { id: 'tech', name: '테크' },
    { id: 'fitness', name: '운동' },
    { id: 'lifestyle', name: '라이프' },
  ];

  const platforms = [
    { id: '', name: '전체 플랫폼' },
    { id: 'instagram', name: '인스타그램' },
    { id: 'youtube', name: '유튜브' },
    { id: 'tiktok', name: '틱톡' },
    { id: 'blog', name: '블로그' },
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">추천 캠페인 관리</h1>
        <p className="text-gray-600 mt-2">메인 페이지에 표시되는 추천 캠페인을 관리합니다.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">추천 캠페인 설정</h2>
          <button
            onClick={() => handleUpdate({ visible: !recommendedSection.visible })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              recommendedSection.visible 
                ? 'bg-green-50 text-green-700 border-green-300' 
                : 'bg-gray-50 text-gray-700 border-gray-300'
            }`}
          >
            {recommendedSection.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{recommendedSection.visible ? '표시중' : '숨김'}</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* 기본 설정 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                섹션 제목
              </label>
              <input
                type="text"
                value={recommendedSection.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부제목 (선택사항)
              </label>
              <input
                type="text"
                value={recommendedSection.subtitle || ''}
                onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 지금 주목할만한 캠페인을 만나보세요"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              표시 개수
            </label>
            <select
              value={recommendedSection.count}
              onChange={(e) => handleUpdate({ count: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5개</option>
              <option value={10}>10개</option>
              <option value={15}>15개</option>
              <option value={20}>20개</option>
            </select>
          </div>

          {/* 선택 모드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              캠페인 선택 방식
            </label>
            <div className="space-y-2">
              <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                recommendedSection.selectionMode === 'auto'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="selectionMode"
                  value="auto"
                  checked={recommendedSection.selectionMode === 'auto'}
                  onChange={(e) => handleUpdate({ selectionMode: 'auto' as const })}
                  className="mt-0.5 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">자동 선택</div>
                  <div className="text-sm text-gray-600">설정한 조건에 맞는 캠페인을 자동으로 표시합니다</div>
                </div>
              </label>

              <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                recommendedSection.selectionMode === 'manual'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="selectionMode"
                  value="manual"
                  checked={recommendedSection.selectionMode === 'manual'}
                  onChange={(e) => handleUpdate({ selectionMode: 'manual' as const })}
                  className="mt-0.5 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">수동 선택</div>
                  <div className="text-sm text-gray-600">특정 캠페인을 직접 선택하여 표시합니다</div>
                </div>
              </label>
            </div>
          </div>

          {/* 자동 선택 필터 */}
          {recommendedSection.selectionMode === 'auto' && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">자동 선택 필터</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={recommendedSection.autoFilter?.category || ''}
                    onChange={(e) => handleUpdate({ 
                      autoFilter: { ...recommendedSection.autoFilter, category: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    플랫폼
                  </label>
                  <select
                    value={recommendedSection.autoFilter?.platform || ''}
                    onChange={(e) => handleUpdate({ 
                      autoFilter: { ...recommendedSection.autoFilter, platform: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {platforms.map(platform => (
                      <option key={platform.id} value={platform.id}>{platform.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최소 예산
                  </label>
                  <input
                    type="number"
                    value={recommendedSection.autoFilter?.minBudget || ''}
                    onChange={(e) => handleUpdate({ 
                      autoFilter: { 
                        ...recommendedSection.autoFilter, 
                        minBudget: e.target.value ? parseInt(e.target.value) : undefined 
                      }
                    })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 수동 선택 */}
          {recommendedSection.selectionMode === 'manual' && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">캠페인 선택</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-4">
                  캠페인 ID를 입력하여 표시할 캠페인을 선택하세요.
                </p>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="캠페인 ID를 쉼표로 구분하여 입력 (예: camp1, camp2, camp3)"
                  value={recommendedSection.manualCampaignIds?.join(', ') || ''}
                  onChange={(e) => {
                    const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id);
                    handleUpdate({ manualCampaignIds: ids });
                  }}
                />
              </div>
            </div>
          )}

          {/* 미리보기 */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">레이아웃 미리보기</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">{recommendedSection.title}</h3>
                  {recommendedSection.subtitle && (
                    <p className="text-sm text-gray-600 mt-0.5">{recommendedSection.subtitle}</p>
                  )}
                </div>
                <span className="text-sm text-blue-600 font-medium">전체보기 →</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[...Array(Math.min(5, recommendedSection.count))].map((_, index) => (
                  <div key={index} className="bg-white border rounded-lg p-2">
                    <div className="aspect-video bg-gray-200 rounded mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>

              {recommendedSection.count > 5 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                  {[...Array(Math.min(5, recommendedSection.count - 5))].map((_, index) => (
                    <div key={index} className="bg-white border rounded-lg p-2">
                      <div className="aspect-video bg-gray-200 rounded mb-2"></div>
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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