'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/utils/structured-logger';

// 정적 번역 파일 import (빌드 타임에 포함)
import { translations as koTranslations } from '@/locales/static/ko';
import { translations as enTranslations } from '@/locales/static/en';
import { translations as jpTranslations } from '@/locales/static/jp';

type Language = 'ko' | 'en' | 'ja';

// 정적 번역 맵 (모든 언어가 메모리에 로드됨)
const staticTranslations = {
  ko: koTranslations,
  en: enTranslations,
  ja: jpTranslations  // jp -> ja 매핑
} as const;

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

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

export function OptimizedLanguageProvider({ children, initialLanguage = 'ko' }: LanguageProviderProps) {
  // 하이드레이션 문제 방지를 위해 초기값은 SSR과 동일하게 설정
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(initialLanguage);
  const [isLoading] = useState(false); // 정적 파일이므로 로딩 없음
  const queryClient = useQueryClient();
  
  // 클라이언트에서만 실제 언어 설정 적용
  useEffect(() => {
    const storedLang = getStoredLanguage();
    if (storedLang !== initialLanguage) {
      setCurrentLanguageState(storedLang);
    }
  }, [initialLanguage]);

  // 언어 목록
  const languages = [
    { code: 'ko' as Language, name: 'Korean', nativeName: '한국어' },
    { code: 'en' as Language, name: 'English', nativeName: 'English' },
    { code: 'ja' as Language, name: 'Japanese', nativeName: '日本語' }
  ];

  // 언어 설정 함수 (API 호출 없이 즉시 전환)
  const setLanguage = useCallback((lang: Language) => {
    setCurrentLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      // HTML lang 속성 업데이트
      document.documentElement.lang = lang;
      // 커스텀 이벤트 발생 (다른 컴포넌트에서 감지 가능)
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
      // React Query 캐시 무효화 - 언어 관련 쿼리만
      queryClient.invalidateQueries({ queryKey: ['translations'] });
    }
    
    logger.info(`Language changed to ${lang}`, { module: 'OptimizedLanguageContext' });
  }, [queryClient]);

  // 번역 함수 (정적 파일에서 즉시 반환 - 0ms)
  const t = useCallback((key: string, fallback?: string): string => {
    // 현재 언어의 번역 데이터 가져오기
    const translations = staticTranslations[currentLanguage];
    
    // TypeScript 타입 체크를 위한 any 캐스팅
    const translation = (translations as any)[key];
    
    if (translation) {
      return translation;
    }
    
    // 번역이 없으면 한국어로 폴백
    if (currentLanguage !== 'ko') {
      const koTranslation = (staticTranslations.ko as any)[key];
      if (koTranslation) {
        logger.debug(`Translation missing for ${key} in ${currentLanguage}, using Korean`, { 
          module: 'OptimizedLanguageContext' 
        });
        return koTranslation;
      }
    }
    
    // 그래도 없으면 fallback 또는 key 반환
    if (fallback) {
      return fallback;
    }
    
    logger.warn(`Translation key not found: ${key}`, { module: 'OptimizedLanguageContext' });
    return key;
  }, [currentLanguage]);

  // 동적 텍스트 번역 (캠페인 제목 등 - API 호출)
  const translateDynamic = useCallback(async (text: string): Promise<string> => {
    if (currentLanguage === 'ko') {
      return text; // 한국어는 번역 불필요
    }

    try {
      // 캐시 체크 (sessionStorage 사용)
      const cacheKey = `trans_${currentLanguage}_${btoa(text).substring(0, 20)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        return cached;
      }

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
          const translated = data.translated[0].translations[currentLanguage] || text;
          // 캐시 저장
          sessionStorage.setItem(cacheKey, translated);
          return translated;
        }
      }
    } catch (error) {
      logger.error('Dynamic translation failed', error as Error, { module: 'OptimizedLanguageContext' });
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
  data: { translations?: Record<string, string>; [key: string]: unknown },
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
  const fieldValue = data[fieldName];
  return typeof fieldValue === 'string' ? fieldValue : '';
}

// 정적 번역 키 타입 (자동완성 지원)
export type TranslationKey = keyof typeof koTranslations;

// 모든 번역 키 export (디버깅용)
export const availableTranslationKeys = Object.keys(koTranslations) as TranslationKey[];