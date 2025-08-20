/**
 * 정적 번역 파일 생성 스크립트
 * JSON 파일을 TypeScript로 변환하여 빌드 타임에 포함
 */

const fs = require('fs').promises;
const path = require('path');

async function generateStaticTranslations() {
  console.log('🌐 정적 번역 파일 생성 중...');
  
  try {
    const localesDir = path.join(process.cwd(), 'src/locales/generated');
    const staticDir = path.join(process.cwd(), 'src/locales/static');
    
    // 정적 디렉토리 생성
    await fs.mkdir(staticDir, { recursive: true });
    
    // 각 언어별 JSON 읽기 및 TS 파일 생성
    const languages = ['ko', 'en', 'jp'];
    
    for (const lang of languages) {
      const jsonPath = path.join(localesDir, `${lang}.json`);
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const translations = JSON.parse(jsonContent);
      
      // TypeScript 파일 생성
      const tsContent = `// Auto-generated at ${new Date().toISOString()}
// DO NOT EDIT - This file is generated from ${lang}.json

export const translations = ${JSON.stringify(translations, null, 2)} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey): string {
  return translations[key] || key;
}
`;
      
      await fs.writeFile(
        path.join(staticDir, `${lang}.ts`),
        tsContent
      );
      
      console.log(`  ✅ ${lang}.ts 생성 완료 (${Object.keys(translations).length}개 키)`);
    }
    
    // 통합 index 파일 생성
    const indexContent = `// Auto-generated translation index
// DO NOT EDIT

import { translations as ko } from './ko';
import { translations as en } from './en';
import { translations as jp } from './jp';

export type LanguageCode = 'ko' | 'en' | 'jp';

const translationMap = {
  ko,
  en,
  jp
} as const;

/**
 * 정적 번역 함수 (0ms 로딩)
 */
export function getTranslation(key: string, lang: LanguageCode = 'ko'): string {
  const translations = translationMap[lang];
  return (translations as any)[key] || key;
}

/**
 * 다국어 객체 반환
 */
export function getTranslations(key: string): { ko: string; en: string; jp: string } {
  return {
    ko: getTranslation(key, 'ko'),
    en: getTranslation(key, 'en'),
    jp: getTranslation(key, 'jp')
  };
}

export { ko, en, jp };
`;
    
    await fs.writeFile(
      path.join(staticDir, 'index.ts'),
      indexContent
    );
    
    console.log('\n✨ 정적 번역 파일 생성 완료!');
    console.log(`📁 위치: ${staticDir}`);
    
  } catch (error) {
    console.error('❌ 정적 번역 파일 생성 실패:', error);
    process.exit(1);
  }
}

generateStaticTranslations();