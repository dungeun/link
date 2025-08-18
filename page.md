'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Image, Save, Globe } from 'lucide-react';

interface CategoryMenu {
  id: string;
  name: string;
  categoryId: string;
  icon?: string;
  badge?: string;
  visible: boolean;
  order: number;
}

const categories = [
  { id: 'beauty', name: '뷰티' },
  { id: 'fashion', name: '패션' },
  { id: 'food', name: '맛집' },
  { id: 'travel', name: '여행' },
  { id: 'tech', name: '테크' },
  { id: 'fitness', name: '운동' },
  { id: 'lifestyle', name: '라이프' },
  { id: 'pet', name: '반려동물' },
  { id: 'parenting', name: '육아' },
  { id: 'game', name: '게임' },
  { id: 'education', name: '교육' },
];

export default function CategorySectionEditPage() {
  const router = useRouter();
  const [categoryMenus, setCategoryMenus] = useState<CategoryMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [gridLayout, setGridLayout] = useState('6x11');

  // DB에서 데이터 로드
  useEffect(() => {
    loadSection();
  }, []);

  const loadSection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ui-sections/category');
      
      if (response.ok) {
        const data = await response.json();
        if (data.section) {
          // content.categories 데이터를 categoryMenus 상태로 설정
          if (data.section.content?.categories) {
            setCategoryMenus(data.section.content.categories);
          }
          if (data.section.content?.gridLayout) {
            setGridLayout(data.section.content.gridLayout);
          }
          setSectionVisible(data.section.visible);
        }
      } else if (response.status === 404) {
        // 섹션이 없으면 기본 데이터로 초기화
        setCategoryMenus([
          { id: '1', name: '뷰티', categoryId: 'beauty', visible: true, order: 1 },
          { id: '2', name: '패션', categoryId: 'fashion', visible: true, order: 2, badge: 'HOT' },
          { id: '3', name: '맛집', categoryId: 'food', visible: true, order: 3 },
          { id: '4', name: '여행', categoryId: 'travel', visible: true, order: 4 },
          { id: '5', name: '테크', categoryId: 'tech', visible: true, order: 5, badge: '신규' },
          { id: '6', name: '운동', categoryId: 'fitness', visible: true, order: 6 },
          { id: '7', name: '라이프', categoryId: 'lifestyle', visible: true, order: 7 },
          { id: '8', name: '반려동물', categoryId: 'pet', visible: true, order: 8 },
          { id: '9', name: '육아', categoryId: 'parenting', visible: true, order: 9 },
          { id: '10', name: '게임', categoryId: 'game', visible: true, order: 10 },
          { id: '11', name: '교육', categoryId: 'education', visible: true, order: 11 },
        ]);
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

  const handleAddCategory = () => {
    const newCategory: CategoryMenu = {
      id: Date.now().toString(),
      name: '새 카테고리',
      categoryId: 'new',
      visible: true,
      order: categoryMenus.length + 1
    };
    setCategoryMenus([...categoryMenus, newCategory]);
  };

  const handleUpdateCategory = (id: string, updates: Partial<CategoryMenu>) => {
    setCategoryMenus(categoryMenus.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ));
  };

  const handleDeleteCategory = (id: string) => {
    setCategoryMenus(categoryMenus.filter(cat => cat.id !== id));
  };

  const handleReorder = (dragIndex: number, dropIndex: number) => {
    const draggedItem = categoryMenus[dragIndex];
    const newMenus = [...categoryMenus];
    newMenus.splice(dragIndex, 1);
    newMenus.splice(dropIndex, 0, draggedItem);
    
    // 순서 재정렬
    const reorderedMenus = newMenus.map((menu, index) => ({
      ...menu,
      order: index + 1
    }));
    
    setCategoryMenus(reorderedMenus);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ui-sections/category', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: { 
            categories: categoryMenus,
            gridLayout 
          },
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

  const badgeOptions = [
    { value: '', label: '없음' },
    { value: 'HOT', label: 'HOT', color: 'bg-red-500' },
    { value: '신규', label: '신규', color: 'bg-blue-500' },
    { value: 'BEST', label: 'BEST', color: 'bg-green-500' },
    { value: '인기', label: '인기', color: 'bg-purple-500' },
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
                <h1 className="text-2xl font-bold text-gray-900">카테고리 메뉴 관리</h1>
                <p className="text-sm text-gray-600 mt-1">메인 페이지에 표시되는 카테고리 메뉴를 관리합니다</p>
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

        {/* 설정 옵션 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">표시 설정</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                그리드 레이아웃
              </label>
              <select 
                value={gridLayout}
                onChange={(e) => setGridLayout(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="6x11">모바일 6열 / 데스크탑 11열 (기본)</option>
                <option value="5x10">모바일 5열 / 데스크탑 10열</option>
                <option value="4x8">모바일 4열 / 데스크탑 8열</option>
              </select>
            </div>
          </div>
        </div>

        {/* 카테고리 목록 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">카테고리 목록</h2>
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              카테고리 추가
            </button>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryMenus
            .sort((a, b) => a.order - b.order)
            .map((category, index) => (
            <div key={category.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">#{index + 1}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateCategory(category.id, { visible: !category.visible })}
                    className={`p-1 rounded ${category.visible ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {category.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    카테고리명
                  </label>
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    카테고리 ID
                  </label>
                  <select
                    value={category.categoryId}
                    onChange={(e) => handleUpdateCategory(category.id, { categoryId: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    배지
                  </label>
                  <select
                    value={category.badge || ''}
                    onChange={(e) => handleUpdateCategory(category.id, { badge: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    {badgeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    아이콘 (선택사항)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={category.icon || ''}
                      onChange={(e) => handleUpdateCategory(category.id, { icon: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="이미지 URL 또는 이모지"
                    />
                    <button className="p-1.5 border rounded hover:bg-gray-100">
                      <Image className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 미리보기 */}
                <div className="pt-3 border-t">
                  <p className="text-xs font-medium text-gray-700 mb-2">미리보기</p>
                  <div className="flex justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-indigo-600 relative">
                        {category.icon ? (
                          category.icon.startsWith('http') ? (
                            <img src={category.icon} alt={category.name} className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-2xl">{category.icon}</span>
                          )
                        ) : (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        )}
                        {category.badge && (
                          <span className={`absolute -top-1 -right-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                            badgeOptions.find(b => b.value === category.badge)?.color || 'bg-gray-500'
                          }`}>
                            {category.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-sm">{category.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* 안내 메시지 */}
        {autoTranslate && (
          <div className="mt-8 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 자동 번역 활성화됨:</strong> 저장 시 입력한 한글 카테고리명과 배지가 자동으로 영어와 일본어로 번역됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}