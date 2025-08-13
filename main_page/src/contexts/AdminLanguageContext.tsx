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
  isLoading: boolean;
}

const AdminLanguageContext = createContext<AdminLanguageContextType | undefined>(undefined);

export function AdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const [languagePacks, setLanguagePacks] = useState<Record<string, LanguagePack>>({});
  const [isLoading, setIsLoading] = useState(true);

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

  // 번역 함수 - 항상 한글만 반환
  const t = useCallback((key: string, fallback?: string): string => {
    const pack = languagePacks[key];
    if (!pack) {
      // 언어팩이 없으면 fallback 또는 key 반환
      return fallback || key;
    }
    
    // 항상 한글 텍스트 반환
    return pack.ko || fallback || key;
  }, [languagePacks]);

  const value = {
    t,
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