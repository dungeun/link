'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUIConfigStore } from '@/lib/stores/ui-config.store';
import { HeaderConfigDB } from '@/components/admin/ui-config/HeaderConfigDB';
import { FooterConfigDB } from '@/components/admin/ui-config/FooterConfigDB';
import { SectionsConfigTab } from '@/components/admin/ui-config/SectionsConfigTab';
import { SectionOrderTab } from '@/components/admin/ui-config/SectionOrderTab';
import { CategoryConfigTab } from '@/components/admin/ui-config/CategoryConfigTab';
import { useLanguage } from '@/hooks/useLanguage';

export default function UIConfigPage() {
  const { config, resetToDefault } = useUIConfigStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  
  // URL 파라미터에서 탭 읽기
  const tabParam = searchParams.get('tab');
  const initialTab = (tabParam as 'header' | 'footer' | 'sections' | 'section-order' | 'categories') || 'header';
  const [activeTab, setActiveTab] = useState<'header' | 'footer' | 'sections' | 'section-order' | 'categories'>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // URL 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['header', 'footer', 'sections', 'section-order', 'categories'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'header' | 'footer' | 'sections' | 'section-order' | 'categories') => {
    setActiveTab(tab);
    router.push(`/admin/ui-config?tab=${tab}`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.ui.title', 'UI 설정 관리')}</h1>
        <p className="text-gray-600 mt-2">{t('admin.ui.description', '헤더, 푸터 및 홈페이지 섹션을 관리합니다.')}</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex space-x-1 mb-8">
        <button
          onClick={() => handleTabChange('header')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'header'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {t('admin.ui.tab.header', '헤더 설정')}
        </button>
        <button
          onClick={() => handleTabChange('footer')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'footer'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {t('admin.ui.tab.footer', '푸터 설정')}
        </button>
        <button
          onClick={() => handleTabChange('sections')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'sections'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {t('admin.ui.tab.sections', '섹션 관리')}
        </button>
        <button
          onClick={() => handleTabChange('section-order')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'section-order'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {t('admin.ui.tab.sectionOrder', '섹션 순서')}
        </button>
        <button
          onClick={() => handleTabChange('categories')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {t('admin.ui.tab.categories', '카테고리')}
        </button>
      </div>

      {activeTab === 'header' && <HeaderConfigDB />}
      {activeTab === 'footer' && <FooterConfigDB />}
      {activeTab === 'sections' && <SectionsConfigTab />}
      {activeTab === 'section-order' && <SectionOrderTab />}
      {activeTab === 'categories' && <CategoryConfigTab />}

      {/* DB 연동 안내 */}
      {activeTab !== 'section-order' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            ✅ {t('admin.ui.dbConnected', '이 페이지는 데이터베이스와 완전히 연동되어 있습니다. 모든 변경사항이 실시간으로 저장되며, 자동 번역 기능이 포함되어 있습니다.')}
          </p>
        </div>
      )}
    </div>
  );
}