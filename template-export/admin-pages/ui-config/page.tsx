'use client';

import { useState } from 'react';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';
import { HeaderConfigImproved } from '@/components/admin/ui-config/HeaderConfigImproved';
import { FooterConfigImproved } from '@/components/admin/ui-config/FooterConfigImproved';
import { SectionsConfigTab } from '@/components/admin/ui-config/SectionsConfigTab';
import { SectionOrderTab } from '@/components/admin/ui-config/SectionOrderTab';

export default function UIConfigPage() {
  const { config, resetToDefault } = useUIConfigStore();
  const [activeTab, setActiveTab] = useState<'header' | 'footer' | 'sections' | 'section-order'>('header');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // API 호출하여 설정 저장
      const response = await fetch('/api/admin/ui-config', {
        method: 'POST',
        credentials: 'include', // 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        setSaveMessage('설정이 성공적으로 저장되었습니다.');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      setSaveMessage('저장 중 오류가 발생했습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">UI 설정 관리</h1>
        <p className="text-gray-600 mt-2">헤더와 푸터의 메뉴 및 콘텐츠를 관리합니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex space-x-1 mb-8">
        <button
          onClick={() => setActiveTab('header')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'header'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          헤더 설정
        </button>
        <button
          onClick={() => setActiveTab('footer')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'footer'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          푸터 설정
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'sections'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          섹션 관리
        </button>
        <button
          onClick={() => setActiveTab('section-order')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'section-order'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          섹션 순서 관리
        </button>
      </div>

      {activeTab === 'header' && <HeaderConfigImproved />}
      {activeTab === 'footer' && <FooterConfigImproved />}
      {activeTab === 'sections' && <SectionsConfigTab />}
      {activeTab === 'section-order' && <SectionOrderTab />}

      {/* 액션 버튼 */}
      <div className="mt-8">
          {saveMessage && (
            <div className={`mb-4 p-4 rounded-lg text-center ${
              saveMessage.includes('오류') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {saveMessage}
            </div>
          )}
          <div className="flex justify-end space-x-4">
            <button
              onClick={resetToDefault}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              기본값으로 초기화
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className={`px-6 py-2 rounded-lg transition-colors ${
                isSaving 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
      </div>
    </div>
  );
}