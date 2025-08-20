// Auto-generated index file
import allPacks from './all-packs.json';
import ko from './ko.json';
import en from './en.json';
import jp from './jp.json';
import metadata from './metadata.json';

export { allPacks, ko, en, jp, metadata };

export type { LanguagePack, LanguagePacks, LanguageCode, LanguagePackKey } from './types';

// 빠른 조회 함수
export function getTranslation(key: string, lang: 'ko' | 'en' | 'jp' = 'ko'): string {
  switch(lang) {
    case 'ko': return (ko as any)[key] || key;
    case 'en': return (en as any)[key] || key;
    case 'jp': return (jp as any)[key] || key;
    default: return key;
  }
}

// 전체 언어팩 조회
export function getLanguagePack(key: string): { ko: string; en: string; jp: string } | null {
  return (allPacks as any)[key] || null;
}
