'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LanguagePack {
  id: string;
  key: string;
  ko: string;
  en: string;
  jp: string;
  category: string;
  description?: string;
}

interface AdminLanguageContextType {
  t: (key: string, fallback?: string) => string;
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  isLoading: boolean;
}

const AdminLanguageContext = createContext<AdminLanguageContextType | undefined>(undefined);

export function AdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const [languagePacks, setLanguagePacks] = useState<Record<string, LanguagePack>>({});
  const [currentLanguage, setCurrentLanguage] = useState('ko');
  const [isLoading, setIsLoading] = useState(true);

  // 언어 설정 로드
  useEffect(() => {
    const savedLanguage = localStorage.getItem('admin-language') || 'ko';
    setCurrentLanguage(savedLanguage);
  }, []);

  // 언어팩 로드
  const loadLanguagePacks = useCallback(async () => {
    try {
      const response = await fetch('/api/language-packs');
      if (response.ok) {
        const packs: LanguagePack[] = await response.json();
        const packMap = packs.reduce((acc, pack) => {
          acc[pack.key] = pack;
          return acc;
        }, {} as Record<string, LanguagePack>);
        setLanguagePacks(packMap);
      }
    } catch (error) {
      console.error('Failed to load language packs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLanguagePacks();
  }, [loadLanguagePacks]);

  // 언어 변경 함수
  const setLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
    localStorage.setItem('admin-language', lang);
  }, []);

  // 번역 함수 - 현재 선택된 언어에 따라 반환
  const t = useCallback((key: string, fallback?: string): string => {
    const pack = languagePacks[key];
    if (!pack) {
      // 언어팩이 없으면 fallback 또는 key 반환
      return fallback || key;
    }
    
    // 현재 언어에 따라 텍스트 반환
    let text = '';
    switch (currentLanguage) {
      case 'en':
        text = pack.en;
        break;
      case 'jp':
        text = pack.jp;
        break;
      case 'ko':
      default:
        text = pack.ko;
        break;
    }
    
    return text || fallback || key;
  }, [languagePacks, currentLanguage]);

  const value = {
    t,
    currentLanguage,
    setLanguage,
    isLoading
  };

  return (
    <AdminLanguageContext.Provider value={value}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  const context = useContext(AdminLanguageContext);
  if (context === undefined) {
    throw new Error('useAdminLanguage must be used within an AdminLanguageProvider');
  }
  return context;
}