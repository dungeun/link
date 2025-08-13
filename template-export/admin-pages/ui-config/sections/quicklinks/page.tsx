'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, Image } from 'lucide-react';

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
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([
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
  const [saving, setSaving] = useState(false);

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
    setQuickLinks(quickLinks.filter(link => link.id !== id));
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

  const emojiSuggestions = [
    '🎯', '📢', '📖', '💎', '🚀', '⭐', '🔥', '💡', '📊', '🎁',
    '🏆', '💰', '📈', '🎨', '📱', '💻', '🌟', '✨', '🎪', '🎬'
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
        <h1 className="text-2xl font-bold text-gray-900">바로가기 링크 관리</h1>
        <p className="text-gray-600 mt-2">메인 페이지에 표시되는 빠른 접근 링크를 관리합니다. (최대 3개)</p>
      </div>

      {/* 링크 목록 */}
      <div className="space-y-4">
        {quickLinks
          .sort((a, b) => a.order - b.order)
          .map((link, index) => (
          <div key={link.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">링크 {index + 1}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdateLink(link.id, { visible: !link.visible })}
                  className={`p-2 rounded ${link.visible ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {link.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="이모지 또는 이미지 URL"
                  />
                  <div className="flex flex-wrap gap-2">
                    {emojiSuggestions.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleUpdateLink(link.id, { icon: emoji })}
                        className="w-10 h-10 border rounded hover:bg-gray-100 text-xl"
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
                <div className="bg-gray-100 rounded-xl p-5 flex items-center justify-center gap-3">
                  {link.icon && (
                    link.icon.startsWith('http') ? (
                      <img src={link.icon} alt={link.title} className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-2xl">{link.icon}</span>
                    )
                  )}
                  <span className="font-medium">{link.title}</span>
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
          className="w-full mt-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        >
          <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <span className="text-gray-600">새 링크 추가</span>
        </button>
      )}

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