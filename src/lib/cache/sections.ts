import { prisma } from "@/lib/db/prisma";
import {
  UISection,
  UISectionContent,
  LanguageCode,
  isLanguageCode,
  isJsonObject,
} from "@/types/global";

// 메모리 캐시
let cachedSections: UISection[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분

export async function getCachedSections(): Promise<UISection[]> {
  const now = Date.now();

  // 캐시가 유효한 경우 바로 반환
  if (cachedSections && now - cacheTimestamp < CACHE_TTL) {
    return cachedSections;
  }

  try {
    // DB에서 섹션 데이터 가져오기 (타임아웃 3초)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database timeout")), 3000);
    });

    const dbPromise = prisma.uISection.findMany({
      where: {
        visible: true,
        type: {
          in: [
            "hero",
            "category",
            "quicklinks",
            "promo",
            "ranking",
            "recommended",
          ],
        },
      },
      orderBy: { order: "asc" },
      // 필요한 필드만 선택하여 성능 향상
      select: {
        id: true,
        type: true,
        sectionId: true,
        title: true,
        subtitle: true,
        content: true,
        translations: true,
        visible: true,
        order: true,
      },
    });

    const dbSections = (await Promise.race([
      dbPromise,
      timeoutPromise,
    ])) as any[];

    // 타입 안전한 변환
    const sections: UISection[] = dbSections.map((section) => {
      let content: UISectionContent = {};
      if (section.content && isJsonObject(section.content)) {
        content = section.content;
      }

      let translations: Record<LanguageCode, UISectionContent> = {} as Record<
        LanguageCode,
        UISectionContent
      >;
      if (section.translations && isJsonObject(section.translations)) {
        Object.entries(section.translations).forEach(([lang, trans]) => {
          if (isLanguageCode(lang) && isJsonObject(trans)) {
            translations[lang] = trans;
          }
        });
      }

      return {
        id: section.id,
        type: section.type as UISection["type"],
        sectionId: section.sectionId,
        title: section.title
          ? isJsonObject(section.title)
            ? (section.title as Record<LanguageCode, string>)
            : undefined
          : undefined,
        subtitle: section.subtitle
          ? isJsonObject(section.subtitle)
            ? (section.subtitle as Record<LanguageCode, string>)
            : undefined
          : undefined,
        content,
        translations,
        visible: section.visible,
        order: section.order,
      };
    });

    // 캐시 업데이트
    cachedSections = sections;
    cacheTimestamp = now;

    return sections;
  } catch (error) {
    console.error("Failed to load sections:", error);

    // DB 실패 시 빈 배열 반환 (기본값)
    const fallbackSections: UISection[] = [];

    // 실패한 경우에도 캐시하여 반복 요청 방지 (1분간)
    if (!cachedSections) {
      cachedSections = fallbackSections;
      cacheTimestamp = now - CACHE_TTL + 60000; // 1분 후 다시 시도
    }

    return cachedSections;
  }
}

// 캐시 무효화 함수 (관리자에서 섹션 업데이트 시 사용)
export function invalidateSectionsCache(): void {
  cachedSections = null;
  cacheTimestamp = 0;
}
