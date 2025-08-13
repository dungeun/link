'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface RankingSection {
  title: string;
  subtitle?: string;
  visible: boolean;
  count: number;
  criteria: 'popular' | 'deadline' | 'reward' | 'participants';
  showBadge: boolean;
}

export default function RankingSectionEditPage() {
  const router = useRouter();
  const [rankingSection, setRankingSection] = useState<RankingSection>({
    title: '실시간 랭킹',
    subtitle: '지금 가장 인기있는 캠페인',
    visible: true,
    count: 5,
    criteria: 'popular',
    showBadge: true
  });
  const [saving, setSaving] = useState(false);

  const handleUpdate = (updates: Partial<RankingSection>) => {
    setRankingSection({ ...rankingSection, ...updates });
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

  const criteriaOptions = [
    { value: 'popular', label: '인기순', description: '참여자가 많은 순서' },
    { value: 'deadline', label: '마감임박순', description: '마감일이 가까운 순서' },
    { value: 'reward', label: '리워드순', description: '리워드가 높은 순서' },
    { value: 'participants', label: '참여자순', description: '신청자가 많은 순서' },
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
        <h1 className="text-2xl font-bold text-gray-900">실시간 랭킹 관리</h1>
        <p className="text-gray-600 mt-2">메인 페이지에 표시되는 캠페인 랭킹을 관리합니다.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">랭킹 설정</h2>
          <button
            onClick={() => handleUpdate({ visible: !rankingSection.visible })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              rankingSection.visible 
                ? 'bg-green-50 text-green-700 border-green-300' 
                : 'bg-gray-50 text-gray-700 border-gray-300'
            }`}
          >
            {rankingSection.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{rankingSection.visible ? '표시중' : '숨김'}</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                섹션 제목
              </label>
              <input
                type="text"
                value={rankingSection.title}
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
                value={rankingSection.subtitle || ''}
                onChange={(e) => handleUpdate({ subtitle: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="예: 지금 가장 인기있는 캠페인"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                표시 개수
              </label>
              <select
                value={rankingSection.count}
                onChange={(e) => handleUpdate({ count: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>TOP 3</option>
                <option value={5}>TOP 5</option>
                <option value={10}>TOP 10</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬 기준
              </label>
              <div className="space-y-2">
                {criteriaOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      rankingSection.criteria === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="criteria"
                      value={option.value}
                      checked={rankingSection.criteria === option.value}
                      onChange={(e) => handleUpdate({ criteria: e.target.value as any })}
                      className="mt-0.5 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rankingSection.showBadge}
                  onChange={(e) => handleUpdate({ showBadge: e.target.checked })}
                  className="mr-2 h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">순위 배지 표시 (1, 2, 3위)</span>
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
                  <h3 className="text-lg font-bold">{rankingSection.title}</h3>
                  {rankingSection.subtitle && (
                    <p className="text-sm text-gray-600 mt-0.5">{rankingSection.subtitle}</p>
                  )}
                </div>
                <span className="text-sm text-blue-600 font-medium">전체보기 →</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[...Array(Math.min(3, rankingSection.count))].map((_, index) => (
                  <div key={index} className="bg-white border rounded-lg p-3 relative">
                    {rankingSection.showBadge && index < 3 && (
                      <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        'bg-gradient-to-br from-orange-400 to-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                    )}
                    <div className="aspect-video bg-gray-200 rounded mb-2"></div>
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

              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  {rankingSection.count > 3 && `... 외 ${rankingSection.count - 3}개 더 표시`}
                </p>
              </div>
            </div>

            {/* 정렬 기준 설명 */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">현재 정렬 기준</h4>
              <p className="text-sm text-blue-800">
                {criteriaOptions.find(o => o.value === rankingSection.criteria)?.label} - 
                {' ' + criteriaOptions.find(o => o.value === rankingSection.criteria)?.description}
              </p>
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