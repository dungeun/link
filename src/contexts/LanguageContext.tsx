'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Language = 'ko' | 'en' | 'ja';

interface LanguagePack {
  id: string;
  key: string;
  ko: string;
  en: string;
  ja: string;
  category: string;
  description?: string;
}

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  translateDynamic: (text: string) => Promise<string>;
  languages: Array<{ code: Language; name: string; nativeName: string }>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 브라우저에서만 localStorage 접근
const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'ko';
  
  const stored = localStorage.getItem('language');
  if (stored && ['ko', 'en', 'ja'].includes(stored)) {
    return stored as Language;
  }
  
  // 브라우저 언어 감지
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('en')) return 'en';
  
  return 'ko'; // 기본값
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>('ko');
  const [languagePacks, setLanguagePacks] = useState<Record<string, LanguagePack>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 언어 목록
  const languages = [
    { code: 'ko' as Language, name: 'Korean', nativeName: '한국어' },
    { code: 'en' as Language, name: 'English', nativeName: 'English' },
    { code: 'ja' as Language, name: 'Japanese', nativeName: '日本語' }
  ];

  // 언어팩 로드
  useEffect(() => {
    const loadLanguagePacks = async () => {
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
    };

    loadLanguagePacks();
  }, []);

  // 초기 언어 설정
  useEffect(() => {
    const lang = getStoredLanguage();
    setCurrentLanguageState(lang);
  }, []);

  // 언어 설정 함수
  const setLanguage = useCallback((lang: Language) => {
    setCurrentLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      // HTML lang 속성 업데이트
      document.documentElement.lang = lang;
      // 커스텀 이벤트 발생 (다른 컴포넌트에서 감지 가능)
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }
  }, []);

  // 번역 함수
  const t = useCallback((key: string, fallback?: string): string => {
    const pack = languagePacks[key];
    if (!pack) {
      // 언어팩이 없으면 fallback 또는 key 반환
      return fallback || key;
    }
    
    // 현재 언어에 맞는 텍스트 반환
    return pack[currentLanguage] || pack.ko || fallback || key;
  }, [languagePacks, currentLanguage]);

  // 동적 텍스트 번역 (API 호출)
  const translateDynamic = useCallback(async (text: string): Promise<string> => {
    if (currentLanguage === 'ko') {
      return text; // 한국어는 번역 불필요
    }

    try {
      const response = await fetch('/api/admin/language-packs/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{ text }],
          targetLanguages: [currentLanguage],
          sourceLanguage: 'ko'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translated && data.translated.length > 0) {
          return data.translated[0].translations[currentLanguage] || text;
        }
      }
    } catch (error) {
      console.error('Dynamic translation failed:', error);
    }

    return text; // 번역 실패 시 원본 반환
  }, [currentLanguage]);

  const value = {
    currentLanguage,
    setLanguage,
    t,
    translateDynamic,
    languages,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// 캠페인 데이터의 번역된 필드 가져오기
export function getTranslatedField(
  data: any,
  fieldName: string,
  language: Language = 'ko'
): string {
  // translations 필드가 있는 경우
  if (data.translations) {
    const translatedFieldName = `${fieldName}_${language}`;
    if (data.translations[translatedFieldName]) {
      return data.translations[translatedFieldName];
    }
  }
  
  // 기본 필드 반환
  return data[fieldName] || '';
}