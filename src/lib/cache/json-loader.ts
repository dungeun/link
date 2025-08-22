/**
 * JSON 캐시 파일 로더
 * 정적 UI 텍스트 및 동적 섹션 데이터를 JSON에서 로드
 */

import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";
import { LanguageCode } from "@/types/global";

export interface JsonCacheData {
  version: string;
  lastUpdated: string;
  type: string;
  data: any;
}

export interface StaticUITexts {
  nav: Record<string, string>;
  auth: Record<string, string>;
  buttons: Record<string, string>;
  status: Record<string, string>;
  forms: Record<string, string>;
  errors: Record<string, string>;
  home: Record<string, any>;
  categories: Record<string, string>;
  campaign: Record<string, string>;
  footer: Record<string, string>;
}

export interface HomepageData {
  sections: any[];
  hero: any;
  categories: any[];
}

/**
 * JSON 파일 로드 with 폴백 시스템
 */
async function loadJsonFile(
  filePath: string,
  fallbackPaths: string[] = [],
): Promise<JsonCacheData | null> {
  const allPaths = [filePath, ...fallbackPaths];

  for (const currentPath of allPaths) {
    try {
      const fileContent = await fs.readFile(currentPath, "utf-8");
      const data = JSON.parse(fileContent);

      logger.info(`JSON file loaded successfully: ${currentPath}`);
      return data;
    } catch (error) {
      logger.warn(
        `Failed to load JSON file: ${currentPath} - ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
  }

  logger.error(`All JSON file paths failed: ${allPaths.join(", ")}`);
  return null;
}

/**
 * 정적 UI 텍스트 로드
 */
export async function loadStaticUITexts(
  language: LanguageCode = "ko",
): Promise<StaticUITexts | null> {
  const basePath = path.join(process.cwd(), "public/cache/static/i18n");
  const fileName = `ui-${language}.json`;
  const filePath = path.join(basePath, fileName);

  // 폴백 경로
  const fallbackPaths = [
    path.join(basePath, "ui-ko.json"), // 기본 한국어
    path.join(basePath, "ui-en.json"), // 영어
  ];

  const jsonData = await loadJsonFile(filePath, fallbackPaths);
  return jsonData?.data || null;
}

/**
 * 홈페이지 섹션 데이터 로드
 */
export async function loadHomepageData(): Promise<HomepageData | null> {
  const basePath = path.join(process.cwd(), "public/cache/dynamic/homepage");

  try {
    // 3개 파일 병렬 로드
    const [sectionsData, heroData, categoriesData] = await Promise.all([
      loadJsonFile(path.join(basePath, "sections.json"), [
        path.join(basePath, "sections.backup.json"),
        path.join(basePath, "sections.default.json"),
      ]),
      loadJsonFile(path.join(basePath, "hero.json"), []),
      loadJsonFile(path.join(basePath, "categories.json"), []),
    ]);

    if (!sectionsData) {
      logger.error("Failed to load sections data");
      return null;
    }

    return {
      sections: sectionsData.data?.sections || [],
      hero: heroData?.data || null,
      categories: categoriesData?.data?.categories || [],
    };
  } catch (error) {
    logger.error(
      `Failed to load homepage data: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/**
 * 섹션 데이터를 UI Section 형태로 변환
 */
export function transformToUISection(homepageData: HomepageData) {
  if (!homepageData.sections) return [];

  return homepageData.sections.map((section) => {
    let content: any = {};

    // 섹션 타입별 컨텐츠 매핑
    switch (section.type) {
      case "hero":
        content = {
          slides: homepageData.hero?.slides || [],
        };
        break;

      case "category":
        content = {
          categories: homepageData.categories || [],
        };
        break;

      default:
        content = {};
    }

    return {
      id: section.id,
      type: section.type,
      sectionId: section.sectionId || section.type,
      title: section.title || "",
      subtitle: section.subtitle || "",
      content,
      translations: null, // JSON에서는 이미 번역된 데이터를 사용
      visible: section.visible !== false,
      order: section.order || 0,
    };
  });
}

/**
 * JSON 파일 업데이트 (실시간 변경용)
 */
export async function updateJsonFile(
  filePath: string,
  data: any,
): Promise<boolean> {
  try {
    const jsonData: JsonCacheData = {
      version: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      type: data.type || "unknown",
      data,
    };

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    logger.info(`JSON file updated: ${filePath}`);
    return true;
  } catch (error) {
    logger.error(
      `Failed to update JSON file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
}

/**
 * 정적 UI 텍스트 번역 함수
 */
export function createTranslationFunction(staticTexts: StaticUITexts | null) {
  return (key: string, fallback?: string): string => {
    if (!staticTexts) return fallback || key;

    // 키를 점 표기법으로 분리 (예: "nav.home" -> ["nav", "home"])
    const keyParts = key.split(".");
    let current: any = staticTexts;

    for (const part of keyParts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return fallback || key;
      }
    }

    return typeof current === "string" ? current : fallback || key;
  };
}

/**
 * 언어별 정적 텍스트 프리로드
 */
export async function preloadStaticTexts() {
  const languages: LanguageCode[] = ["ko", "en", "jp"];
  const results: Record<LanguageCode, StaticUITexts | null> = {} as any;

  await Promise.all(
    languages.map(async (lang) => {
      results[lang] = await loadStaticUITexts(lang);
    }),
  );

  return results;
}
