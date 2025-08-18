'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Save, Globe } from 'lucide-react';

interface ActiveCampaignsSection {
  title: string;
  subtitle?: string;
  visible: boolean;
  count: number;
  showViewAll: boolean;
  gridLayout: string;
}

export default function ActiveCampaignsSectionEditPage() {
  const router = useRouter();
  const [section, setSection] = useState<ActiveCampaignsSection>({
    title: '진행 중인 캠페인',
    subtitle: '지금 참여할 수 있는 캠페인',
    visible: true,
    count: 8,
    showViewAll: true,
    gridLayout: '2x4'
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);

  // DB에서 데이터 로드
  useEffect(() => {
    loadSection();
  }, []);

  const loadSection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ui-sections/active-campaigns');
      
      if (response.ok) {
        const data = await response.json();
        if (data.section) {
          setSection({
            title: data.section.title || '진행 중인 캠페인',
            subtitle: data.section.subtitle || '지금 참여할 수 있는 캠페인',
            visible: data.section.visible,
            count: data.section.content?.count || 8,
            showViewAll: data.section.content?.showViewAll ?? true,
            gridLayout: data.section.content?.gridLayout || '2x4'
          });
        }
      }
    } catch (error) {
      console.error('Error loading section:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updates: Partial<ActiveCampaignsSection>) => {
    setSection({ ...section, ...updates });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ui-sections/active-campaigns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          visible: section.visible,
          title: section.title,
          subtitle: section.subtitle,
          content: {
            count: section.count,
            showViewAll: section.showViewAll,
            gridLayout: section.gridLayout
          },
          autoTranslate
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

  const gridOptions = [
    { value: '2x4', label: '모바일 2열 / 데스크톱 4열 (기본)' },
    { value: '2x3', label: '모바일 2열 / 데스크톱 3열' },
    { value: '1x2', label: '모바일 1열 / 데스크톱 2열' },
  ];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <h1 className="text-2xl font-bold text-gray-900">진행 중인 캠페인 관리</h1>
                <p className="text-sm text-gray-600 mt-1">메인 페이지에 표시되는 진행 중인 캠페인 섹션을 관리합니다</p>
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
                  checked={section.visible}
                  onChange={(e) => handleUpdate({ visible: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  section.visible ? 'bg-green-600' : 'bg-gray-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform mt-1 ${
                    section.visible ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </div>
                <span className="flex items-center gap-1 text-sm text-gray-700">
                  {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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

        {/* 설정 옵션 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">표시 설정</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  섹션 제목
                </label>
                <input
                  type="text"
                  value={section.title}
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
                  value={section.subtitle || ''}
                  onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 지금 참여할 수 있는 캠페인"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  표시 개수
                </label>
                <select
                  value={section.count}
                  onChange={(e) => handleUpdate({ count: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={4}>4개</option>
                  <option value={8}>8개</option>
                  <option value={12}>12개</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  그리드 레이아웃
                </label>
                <select
                  value={section.gridLayout}
                  onChange={(e) => handleUpdate({ gridLayout: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {gridOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={section.showViewAll}
                    onChange={(e) => handleUpdate({ showViewAll: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">&quot;전체보기&quot; 버튼 표시</span>
                </label>
              </div>
            </div>

            {/* 미리보기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                미리보기
              </label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{section.title}</h3>
                    {section.subtitle && (
                      <p className="text-sm text-gray-600 mt-0.5">{section.subtitle}</p>
                    )}
                  </div>
                  {section.showViewAll && (
                    <span className="text-sm text-blue-600 font-medium">전체보기 →</span>
                  )}
                </div>

                <div className={`grid ${
                  section.gridLayout === '2x4' ? 'grid-cols-2 md:grid-cols-4' :
                  section.gridLayout === '2x3' ? 'grid-cols-2 md:grid-cols-3' :
                  'grid-cols-1 md:grid-cols-2'
                } gap-3`}>
                  {[...Array(Math.min(section.count, 8))].map((_, index) => (
                    <div key={index} className="bg-white border rounded-lg p-3">
                      <div className="aspect-square bg-gray-200 rounded mb-2"></div>
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="h-2 bg-gray-200 rounded w-16"></div>
                          <div className="h-2 bg-blue-200 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        {autoTranslate && (
          <div className="mt-8 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 자동 번역 활성화됨:</strong> 저장 시 입력한 한글 제목과 부제목이 자동으로 영어와 일본어로 번역됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}