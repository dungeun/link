'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Save, Globe } from 'lucide-react';

interface QuickLink {
  id: string;
  title: string;
  link: string;
  icon?: string;
  visible: boolean;
  order: number;
}

export default function QuickLinksSectionEditPage() {
  const router = useRouter();
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
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
      const response = await fetch('/api/admin/ui-sections/quicklinks');
      
      if (response.ok) {
        const data = await response.json();
        if (data.section) {
          // content.links 데이터를 quickLinks 상태로 설정
          if (data.section.content?.links) {
            setQuickLinks(data.section.content.links);
          }
          setSectionVisible(data.section.visible);
        }
      } else if (response.status === 404) {
        // 섹션이 없으면 기본 데이터로 초기화
        setQuickLinks([
          { 
            id: '1', 
            title: '인플루언서 등록', 
            link: '/register?type=influencer', 
            icon: '🎯',
            visible: true, 
            order: 1 
          },
          { 
            id: '2', 
            title: '캠페인 의뢰', 
            link: '/register?type=business', 
            icon: '📢',
            visible: true, 
            order: 2 
          },
          { 
            id: '3', 
            title: '이용가이드', 
            link: '/guide', 
            icon: '📖',
            visible: true, 
            order: 3 
          },
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

  const handleAddLink = () => {
    if (quickLinks.length >= 3) {
      alert('바로가기 링크는 최대 3개까지만 추가할 수 있습니다.');
      return;
    }

    const newLink: QuickLink = {
      id: Date.now().toString(),
      title: '새 링크',
      link: '/',
      visible: true,
      order: quickLinks.length + 1
    };
    setQuickLinks([...quickLinks, newLink]);
  };

  const handleUpdateLink = (id: string, updates: Partial<QuickLink>) => {
    setQuickLinks(quickLinks.map(link => 
      link.id === id ? { ...link, ...updates } : link
    ));
  };

  const handleDeleteLink = (id: string) => {
    if (quickLinks.length <= 1) {
      alert('최소 1개의 링크는 필요합니다.');
      return;
    }
    
    if (confirm('이 링크를 삭제하시겠습니까?')) {
      setQuickLinks(quickLinks.filter(link => link.id !== id));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ui-sections/quicklinks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: { links: quickLinks },
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

  const emojiSuggestions = [
    '🎯', '📢', '📖', '💎', '🚀', '⭐', '🔥', '💡', '📊', '🎁',
    '🏆', '💰', '📈', '🎨', '📱', '💻', '🌟', '✨', '🎪', '🎬'
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
                <h1 className="text-2xl font-bold text-gray-900">바로가기 링크 관리</h1>
                <p className="text-sm text-gray-600 mt-1">메인 페이지에 표시되는 빠른 접근 링크를 관리합니다 (최대 3개)</p>
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

        {/* 링크 목록 */}
        <div className="space-y-4">
          {quickLinks
            .sort((a, b) => a.order - b.order)
            .map((link, index) => (
            <div key={link.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">링크 {index + 1}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateLink(link.id, { visible: !link.visible })}
                    className={`p-2 rounded-lg transition-colors ${
                      link.visible ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {link.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteLink(link.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목
                    </label>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleUpdateLink(link.id, { title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="링크 제목을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      링크 URL
                    </label>
                    <input
                      type="text"
                      value={link.link}
                      onChange={(e) => handleUpdateLink(link.id, { link: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="/campaigns"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      아이콘
                    </label>
                    <input
                      type="text"
                      value={link.icon || ''}
                      onChange={(e) => handleUpdateLink(link.id, { icon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                      placeholder="이모지 또는 이미지 URL"
                    />
                    <div className="flex flex-wrap gap-2">
                      {emojiSuggestions.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleUpdateLink(link.id, { icon: emoji })}
                          className="w-10 h-10 border border-gray-200 rounded-lg hover:bg-gray-100 text-xl transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 미리보기 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    미리보기
                  </label>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                    {link.icon && (
                      link.icon.startsWith('http') ? (
                        <img src={link.icon} alt={link.title} className="w-12 h-12 object-contain" />
                      ) : (
                        <span className="text-4xl">{link.icon}</span>
                      )
                    )}
                    <span className="font-medium text-lg text-gray-800">{link.title}</span>
                    <span className="text-xs text-gray-500">{link.link}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 링크 추가 버튼 */}
        {quickLinks.length < 3 && (
          <button
            onClick={handleAddLink}
            className="w-full mt-6 bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Plus className="w-5 h-5" />
            새 링크 추가
          </button>
        )}

        {/* 안내 메시지 */}
        {autoTranslate && (
          <div className="mt-8 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 자동 번역 활성화됨:</strong> 저장 시 입력한 한글 링크 제목이 자동으로 영어와 일본어로 번역됩니다. 이모지는 그대로 유지됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}