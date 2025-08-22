#!/usr/bin/env ts-node

/**
 * 언어팩 정적 파일 생성기
 * 빌드 타임에 실행하여 JSON 파일 생성
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

interface LanguagePack {
  [key: string]: {
    ko: string;
    en: string;
    jp: string;
  };
}

async function generateStaticLanguagePacks() {
  console.log("🔄 언어팩 정적 파일 생성 시작...");

  try {
    // DB에서 모든 언어팩 가져오기
    const startTime = Date.now();
    const packs = await prisma.languagePack.findMany({
      select: {
        key: true,
        ko: true,
        en: true,
        jp: true,
        category: true,
      },
    });
    console.log(
      `✅ ${packs.length}개 언어팩 로드 완료 (${Date.now() - startTime}ms)`,
    );

    // 카테고리별로 그룹화
    const categorized: Record<string, LanguagePack> = {};
    const allPacks: LanguagePack = {};

    packs.forEach((pack) => {
      const item = {
        ko: pack.ko || "",
        en: pack.en || "",
        jp: pack.jp || "",
      };

      // 전체 팩에 추가
      allPacks[pack.key] = item;

      // 카테고리별 팩에 추가
      const category = pack.category || "common";
      if (!categorized[category]) {
        categorized[category] = {};
      }
      categorized[category][pack.key] = item;
    });

    // 출력 디렉토리 생성
    const outputDir = path.join(process.cwd(), "src/locales/generated");
    await fs.mkdir(outputDir, { recursive: true });

    // 1. 전체 언어팩 파일 생성
    await fs.writeFile(
      path.join(outputDir, "all-packs.json"),
      JSON.stringify(allPacks, null, 2),
    );
    console.log("✅ all-packs.json 생성 완료");

    // 2. 언어별 파일 생성 (더 작은 번들 사이즈)
    const languages = ["ko", "en", "jp"] as const;
    for (const lang of languages) {
      const langPack: Record<string, string> = {};
      packs.forEach((pack) => {
        langPack[pack.key] = pack[lang] || "";
      });

      await fs.writeFile(
        path.join(outputDir, `${lang}.json`),
        JSON.stringify(langPack, null, 2),
      );
      console.log(`✅ ${lang}.json 생성 완료`);
    }

    // 3. 카테고리별 파일 생성
    for (const [category, categoryPacks] of Object.entries(categorized)) {
      await fs.writeFile(
        path.join(outputDir, `category-${category}.json`),
        JSON.stringify(categoryPacks, null, 2),
      );
    }
    console.log(
      `✅ ${Object.keys(categorized).length}개 카테고리 파일 생성 완료`,
    );

    // 4. TypeScript 타입 정의 생성
    const typeDefinition = `// Auto-generated - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

export interface LanguagePack {
  ko: string;
  en: string;
  jp: string;
}

export interface LanguagePacks {
  [key: string]: LanguagePack;
}

export type LanguageCode = 'ko' | 'en' | 'jp';

// 언어팩 키 타입 (자동완성 지원)
export type LanguagePackKey = ${packs.map((p) => `'${p.key}'`).join(" | ")};
`;

    await fs.writeFile(path.join(outputDir, "types.ts"), typeDefinition);
    console.log("✅ TypeScript 타입 정의 생성 완료");

    // 5. 메타데이터 생성
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalPacks: packs.length,
      categories: Object.keys(categorized),
      languages: languages,
      sizeInfo: {
        all: `${JSON.stringify(allPacks).length / 1024}KB`,
        perLanguage: languages.map((lang) => ({
          lang,
          size: `${JSON.stringify(packs.map((p) => p[lang])).length / 1024}KB`,
        })),
      },
    };

    await fs.writeFile(
      path.join(outputDir, "metadata.json"),
      JSON.stringify(metadata, null, 2),
    );
    console.log("✅ 메타데이터 생성 완료");

    // 6. 빠른 액세스를 위한 인덱스 파일 생성
    const indexContent = `// Auto-generated index file
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
    case 'ko': return ko[key] || key;
    case 'en': return en[key] || key;
    case 'jp': return jp[key] || key;
    default: return key;
  }
}

// 전체 언어팩 조회
export function getLanguagePack(key: string): { ko: string; en: string; jp: string } | null {
  return allPacks[key] || null;
}
`;

    await fs.writeFile(path.join(outputDir, "index.ts"), indexContent);
    console.log("✅ 인덱스 파일 생성 완료");

    console.log("\n📊 생성 완료 통계:");
    console.log(`  - 총 언어팩: ${packs.length}개`);
    console.log(
      `  - 전체 크기: ${(JSON.stringify(allPacks).length / 1024).toFixed(2)}KB`,
    );
    console.log(`  - 출력 경로: ${outputDir}`);
    console.log("\n🎉 언어팩 정적 파일 생성 완료!");
  } catch (error) {
    console.error("❌ 언어팩 생성 실패:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
generateStaticLanguagePacks();
