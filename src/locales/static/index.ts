// Auto-generated translation index
// DO NOT EDIT

import { translations as ko } from "./ko";
import { translations as en } from "./en";
import { translations as jp } from "./jp";

export type LanguageCode = "ko" | "en" | "jp";

const translationMap = {
  ko,
  en,
  jp,
} as const;

/**
 * 정적 번역 함수 (0ms 로딩)
 */
export function getTranslation(key: string, lang: LanguageCode = "ko"): string {
  const translations = translationMap[lang];
  return (translations as any)[key] || key;
}

/**
 * 다국어 객체 반환
 */
export function getTranslations(key: string): {
  ko: string;
  en: string;
  jp: string;
} {
  return {
    ko: getTranslation(key, "ko"),
    en: getTranslation(key, "en"),
    jp: getTranslation(key, "jp"),
  };
}

export { ko, en, jp };
