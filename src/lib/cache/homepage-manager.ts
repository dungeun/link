/**
 * 통합 Homepage JSON 관리 시스템
 * - 단일 JSON 파일로 모든 섹션 관리
 * - 순서 정보 포함
 * - JSON 직접 수정 + 안정성 백업
 */

import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";
import { LanguageCode } from "@/types/global";

export interface HomepageSection {
  type: string;
  visible: boolean;
  data: any;
}

export interface HomepageData {
  metadata: {
    version: string;
    lastUpdated: string;
    orderedAt: string;
    backupLevel: string;
  };
  sectionOrder: string[];
  sections: Record<string, HomepageSection>;
}

export interface SectionUpdateData {
  sectionId: string;
  type: string;
  visible?: boolean;
  data: any;
}

const HOMEPAGE_JSON_PATH = path.join(
  process.cwd(),
  "public/cache/homepage-unified.json",
);
const BACKUP_PATH = path.join(process.cwd(), "public/cache/backups/homepage");

export class HomepageManager {
  /**
   * 데이터베이스 → JSON 동기화
   * 관리자가 UI Config에서 수정한 내용을 JSON에 반영
   */
  async syncFromDatabase(): Promise<boolean> {
    try {
      logger.info("Starting comprehensive database → JSON synchronization");

      // 데이터베이스에서 전체 UI Config 가져오기 (올바른 관리자 API 포트 사용)
      const response = await fetch("http://localhost:3000/api/ui-config", {
        headers: {
          "User-Agent": "HomePage-Sync-Service/1.0.0",
          "Content-Type": "application/json",
          "X-Internal-Request": "true",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch UI config: ${response.status}`);
      }

      const { config } = await response.json();
      const mainPageConfig = config.mainPage || {};

      // 현재 JSON 데이터 로드
      const homepage = await this.loadHomepage();
      if (!homepage) {
        logger.error("Homepage data not found");
        return false;
      }

      // 백업 생성 (한 번만)
      await this.createBackup(homepage);

      let hasUpdates = false;

      // 1. QuickLinks 동기화
      if (mainPageConfig.quickLinks && homepage.sections.quicklinks) {
        const updatedLinks = await Promise.all(
          mainPageConfig.quickLinks.map(async (link: any) => ({
            id: link.id,
            title: await this.generateMultiLanguageText(link.title),
            url: link.link,
            icon: link.icon,
            order: link.order,
            visible: link.visible,
          })),
        );
        homepage.sections.quicklinks.data.links = updatedLinks;
        hasUpdates = true;
        logger.info(`✅ Synced ${updatedLinks.length} quicklinks`);
      }

      // 2. Hero Slides 동기화
      if (mainPageConfig.heroSlides && homepage.sections.hero) {
        const updatedSlides = await Promise.all(
          mainPageConfig.heroSlides.map(async (slide: any) => ({
            id: slide.id,
            title: await this.generateMultiLanguageText(slide.title),
            subtitle: await this.generateMultiLanguageText(slide.subtitle),
            tag: slide.tag
              ? await this.generateMultiLanguageText(slide.tag)
              : null,
            bgColor: slide.bgColor,
            backgroundImage: slide.backgroundImage || null,
            link: slide.link || "/campaigns",
            order: slide.order,
            visible: slide.visible,
          })),
        );
        homepage.sections.hero.data.slides = updatedSlides;
        hasUpdates = true;
        logger.info(`✅ Synced ${updatedSlides.length} hero slides`);
      }

      // 3. Category Menus 동기화
      if (mainPageConfig.categoryMenus && homepage.sections.category) {
        const updatedCategories = await Promise.all(
          mainPageConfig.categoryMenus.map(async (cat: any) => ({
            id: cat.id,
            name: await this.generateMultiLanguageText(cat.name),
            slug: cat.categoryId,
            icon: cat.icon,
            badge: cat.badge
              ? await this.generateMultiLanguageText(
                  `category.badge.${cat.badge}`,
                )
              : null,
            badgeColor: this.getBadgeColor(cat.badge),
            href: cat.href,
            order: cat.order,
            visible: cat.visible,
          })),
        );
        homepage.sections.category.data.categories = updatedCategories;
        hasUpdates = true;
        logger.info(`✅ Synced ${updatedCategories.length} categories`);
      }

      // 4. Promo Banner 동기화
      if (mainPageConfig.promoBanner && homepage.sections.promo) {
        const updatedPromo = {
          title: await this.generateMultiLanguageText(
            mainPageConfig.promoBanner.title,
          ),
          subtitle: await this.generateMultiLanguageText(
            mainPageConfig.promoBanner.subtitle,
          ),
          icon: mainPageConfig.promoBanner.icon,
          image: mainPageConfig.promoBanner.image || "/images/promo-banner.jpg",
          link: mainPageConfig.promoBanner.link || "/register?promo=launch30",
          backgroundColor:
            mainPageConfig.promoBanner.backgroundColor || "#FEF3C7",
          textColor: mainPageConfig.promoBanner.textColor || "#000000",
        };
        homepage.sections.promo.data = updatedPromo;
        hasUpdates = true;
        logger.info(`✅ Synced promo banner`);
      }

      // 5. Section Order 동기화
      if (
        mainPageConfig.sectionOrder &&
        Array.isArray(mainPageConfig.sectionOrder)
      ) {
        const newOrder = mainPageConfig.sectionOrder.map(
          (section: any) => section.id || section.type,
        );
        homepage.sectionOrder = newOrder;
        hasUpdates = true;
        logger.info(`✅ Synced section order: ${newOrder.join(", ")}`);
      }

      // 메타데이터 업데이트
      if (hasUpdates) {
        homepage.metadata.lastUpdated = new Date().toISOString();
        homepage.metadata.version = this.generateVersion();
        await this.saveHomepage(homepage);
        logger.info("🎉 Complete database → JSON synchronization finished");
        return true;
      }

      logger.info("No updates needed - database and JSON are in sync");
      return false;
    } catch (error) {
      logger.error(
        `Database sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 배지 색상 매핑
   */
  private getBadgeColor(badge: string | null): string | null {
    if (!badge) return null;

    const colorMap: Record<string, string> = {
      hot: "red",
      new: "blue",
      popular: "red",
      featured: "purple",
      trending: "orange",
    };

    return colorMap[badge.toLowerCase()] || "blue";
  }

  /**
   * 다국어 텍스트 생성 (데이터베이스 언어키 → 다국어 객체)
   */
  private async generateMultiLanguageText(
    languageKey: string,
  ): Promise<{ ko: string; en: string; jp: string }> {
    try {
      // 언어팩 API에서 번역 가져오기 (올바른 관리자 API 포트 사용)
      const response = await fetch("http://localhost:3000/api/language-packs", {
        headers: {
          "User-Agent": "HomePage-Sync-Service/1.0.0",
          "Content-Type": "application/json",
          "X-Internal-Request": "true",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch language packs: ${response.status}`);
      }

      const languagePacks = await response.json();

      // 각 언어에서 해당 키의 번역 찾기
      const ko =
        this.findTranslation(languagePacks, languageKey, "ko") || languageKey;
      const en =
        this.findTranslation(languagePacks, languageKey, "en") || `[EN] ${ko}`;
      const jp =
        this.findTranslation(languagePacks, languageKey, "jp") || `[JP] ${ko}`;

      return { ko, en, jp };
    } catch (error) {
      logger.error(
        `Failed to generate multi-language text: ${error instanceof Error ? error.message : String(error)}`,
      );

      // 폴백: 기본 한국어 텍스트 사용
      const fallbackText = this.extractFallbackText(languageKey);
      return {
        ko: fallbackText,
        en: `[EN] ${fallbackText}`,
        jp: `[JP] ${fallbackText}`,
      };
    }
  }

  /**
   * 언어팩에서 번역 찾기
   */
  private findTranslation(
    languagePacks: any[],
    key: string,
    language: string,
  ): string | null {
    for (const pack of languagePacks) {
      if (pack.language === language && pack.key === key) {
        return pack.value;
      }
    }
    return null;
  }

  /**
   * 폴백 텍스트 추출 (언어키에서 의미있는 텍스트 추출)
   */
  private extractFallbackText(languageKey: string): string {
    const fallbackMap: Record<string, string> = {
      // QuickLinks - 사용자가 실제로 원하는 텍스트
      "quicklink.events": "🎁 첫 캠페인 30%",
      "quicklink.coupons": "📚 캠페인 가이드",
      "quicklink.ranking": "💬 실시간 상담",

      // Hero Slides
      "hero.slide1.title": "인플루언서와 브랜드를\n연결하는 가장 쉬운 방법",
      "hero.slide1.subtitle": "리뷰의 힘을 경험하기 전까지 느끼지 마세요",
      "hero.slide2.title": "최대 30% 할인\n첫 캠페인 특별 혜택",
      "hero.slide2.subtitle": "지금 시작하고 특별한 혜택을 받아보세요",
      "hero.slide3.title": "프리미엄 인플루언서\n매칭 서비스",
      "hero.slide3.subtitle": "당신의 브랜드에 완벽한 인플루언서를 찾아보세요",
      "hero.slide4.title": "실시간 성과 분석",
      "hero.slide4.subtitle": "캠페인 성과를 실시간으로 추적하고 분석하세요",
      "hero.slide5.title": "글로벌 인플루언서 네트워크",
      "hero.slide5.subtitle": "전 세계 인플루언서와 함께 브랜드를 성장시키세요",
      "hero.slide6.title": "안전한 결제 시스템",
      "hero.slide6.subtitle":
        "믿을 수 있는 에스크로 결제로 안전하게 거래하세요",

      // Categories
      "category.campaign": "캠페인",
      "category.hospital": "병원",
      "category.review": "구매평",
      "category.food": "맛집",
      "category.beauty": "뷰티",
      "category.fashion": "패션",
      "category.travel": "여행",
      "category.lifestyle": "라이프스타일",
      "category.plastic_surgery": "성형외과",
      "category.dermatology": "피부과",
      "category.dentistry": "치과",
      "category.ophthalmology": "안과",
      "category.culture": "문화",
      "category.digital": "IT/디지털",

      // Category Badges
      "category.badge.hot": "인기",
      "category.badge.new": "신규",
      "category.badge.popular": "인기",
      "category.badge.featured": "추천",
      "category.badge.trending": "트렌딩",

      // Promo Banner
      "promo.title": "🎉 런칭 기념 특가",
      "promo.subtitle": "지금 가입하면 30% 할인!",

      // Hero Tags
      "🎯 NEW": "NEW",
      NEW: "NEW",
      SPECIAL: "특별",
      HOT: "인기",
    };

    return (
      fallbackMap[languageKey] || languageKey.split(".").pop() || languageKey
    );
  }

  /**
   * 통합 Homepage 데이터 로드
   */
  async loadHomepage(): Promise<HomepageData | null> {
    try {
      const content = await fs.readFile(HOMEPAGE_JSON_PATH, "utf-8");
      const data = JSON.parse(content);

      logger.info("Homepage data loaded successfully");
      return data;
    } catch (error) {
      logger.error(
        `Failed to load homepage data: ${error instanceof Error ? error.message : String(error)}`,
      );

      // 백업에서 복구 시도
      return await this.restoreFromBackup();
    }
  }

  /**
   * 섹션 데이터 업데이트 (관리자가 저장 버튼 클릭시)
   */
  async updateSection(updateData: SectionUpdateData): Promise<boolean> {
    try {
      const homepage = await this.loadHomepage();
      if (!homepage) {
        logger.error("Homepage data not found");
        return false;
      }

      // 백업 생성
      await this.createBackup(homepage);

      // 섹션 업데이트 (다국어 데이터 그대로 저장)
      homepage.sections[updateData.sectionId] = {
        type: updateData.type,
        visible: updateData.visible !== false,
        data: updateData.data,
      };

      // 메타데이터 업데이트
      homepage.metadata.lastUpdated = new Date().toISOString();
      homepage.metadata.version = this.generateVersion();

      // JSON 파일 저장
      await this.saveHomepage(homepage);

      logger.info(`Section updated by admin save: ${updateData.sectionId}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to update section: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 섹션별 번역 생성 (저장 전 미리보기용)
   */
  async generateSectionTranslation(
    sectionId: string,
    sourceData: any,
    targetLanguage: "en" | "jp",
  ): Promise<any> {
    try {
      // Google Translate API 호출하여 번역 생성
      const translatedData = await this.translateSectionTexts(
        sourceData,
        "ko",
        targetLanguage,
      );

      logger.info(
        `Translation generated for section ${sectionId} to ${targetLanguage}`,
      );
      return translatedData;
    } catch (error) {
      logger.error(
        `Failed to generate translation: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * 섹션 텍스트 자동 번역
   */
  private async translateSectionTexts(
    data: any,
    from: string,
    to: string,
  ): Promise<any> {
    // 이 부분은 기존 UI Sections API의 translateContentTexts 함수 로직 활용
    // Google Translate API 호출하여 실제 번역 수행

    if (!data) return data;

    const result = JSON.parse(JSON.stringify(data));

    // 재귀적으로 한국어 텍스트를 찾아서 번역
    const translateObject = async (obj: any): Promise<any> => {
      if (!obj || typeof obj !== "object") return obj;

      if (Array.isArray(obj)) {
        const translated = [];
        for (const item of obj) {
          translated.push(await translateObject(item));
        }
        return translated;
      }

      const translatedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string" && value.trim()) {
          // 문자열이면 번역 수행 (실제로는 Google Translate API 호출)
          translatedObj[key] = await this.callTranslateAPI(value, to);
        } else {
          translatedObj[key] = await translateObject(value);
        }
      }
      return translatedObj;
    };

    return await translateObject(result);
  }

  /**
   * 실제 번역 API 호출 (간소화된 버전)
   */
  private async callTranslateAPI(
    text: string,
    targetLang: string,
  ): Promise<string> {
    try {
      // Google Translate API 환경 변수 확인
      const googleTranslateApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

      if (!googleTranslateApiKey) {
        logger.warn(
          "Google Translate API key not found, using fallback translation",
        );
        return this.getFallbackTranslation(text, targetLang);
      }

      // Google Translate API 호출
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${googleTranslateApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            source: "ko",
            target: targetLang === "jp" ? "ja" : targetLang,
            format: "text",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.data?.translations?.[0]?.translatedText;

      if (translatedText) {
        logger.info(
          `Translated "${text}" to ${targetLang}: "${translatedText}"`,
        );
        return translatedText;
      } else {
        throw new Error("No translation returned from API");
      }
    } catch (error) {
      logger.error(
        `Translation failed for "${text}" to ${targetLang}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.getFallbackTranslation(text, targetLang);
    }
  }

  /**
   * 폴백 번역 (API 실패시 사용)
   */
  private getFallbackTranslation(text: string, targetLang: string): string {
    const fallbackTranslations: Record<string, Record<string, string>> = {
      뷰티: { en: "Beauty", jp: "ビューティー" },
      패션: { en: "Fashion", jp: "ファッション" },
      맛집: { en: "Restaurant", jp: "グルメ" },
      여행: { en: "Travel", jp: "旅行" },
      "IT/테크": { en: "IT/Tech", jp: "IT/テック" },
      "운동/헬스": { en: "Fitness", jp: "フィットネス" },
      라이프: { en: "Lifestyle", jp: "ライフスタ일ル" },
      반려동물: { en: "Pets", jp: "ペット" },
      육아: { en: "Parenting", jp: "育児" },
      게임: { en: "Gaming", jp: "ゲーム" },
      교육: { en: "Education", jp: "教育" },
      인기: { en: "Hot", jp: "人気" },
      신규: { en: "New", jp: "新規" },
      "인플루언서 마케팅의 새로운 기준": {
        en: "New Standard for Influencer Marketing",
        jp: "インフルエンサーマーケティングの新基準",
      },
      "리뷰픽에서 시작하세요": {
        en: "Start with ReviewPick",
        jp: "レビューピックで始めましょう",
      },
      "💰 캠페인 등록": {
        en: "💰 Register Campaign",
        jp: "💰 キャンペーン登録",
      },
      "📊 성과 분석": {
        en: "📊 Performance Analytics",
        jp: "📊 成果分析",
      },
    };

    return (
      fallbackTranslations[text]?.[targetLang] ||
      `[AUTO-${targetLang.toUpperCase()}] ${text}`
    );
  }

  /**
   * 섹션 순서 업데이트
   */
  async updateSectionOrder(newOrder: string[]): Promise<boolean> {
    try {
      const homepage = await this.loadHomepage();
      if (!homepage) {
        logger.error("Homepage data not found");
        return false;
      }

      // 백업 생성
      await this.createBackup(homepage);

      // 순서 업데이트
      homepage.sectionOrder = newOrder;
      homepage.metadata.orderedAt = new Date().toISOString();
      homepage.metadata.lastUpdated = new Date().toISOString();

      await this.saveHomepage(homepage);

      logger.info("Section order updated successfully");
      return true;
    } catch (error) {
      logger.error(
        `Failed to update section order: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 섹션 표시/숨김 토글
   */
  async toggleSectionVisibility(sectionId: string): Promise<boolean> {
    try {
      const homepage = await this.loadHomepage();
      if (!homepage || !homepage.sections[sectionId]) {
        logger.error(`Section not found: ${sectionId}`);
        return false;
      }

      // 백업 생성
      await this.createBackup(homepage);

      // 가시성 토글
      homepage.sections[sectionId].visible =
        !homepage.sections[sectionId].visible;
      homepage.metadata.lastUpdated = new Date().toISOString();

      await this.saveHomepage(homepage);

      logger.info(`Section visibility toggled: ${sectionId}`);
      return true;
    } catch (error) {
      logger.error(
        `Failed to toggle section visibility: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 언어별 섹션 데이터 가져오기
   */
  async getSectionsByLanguage(language: LanguageCode): Promise<any[]> {
    try {
      const homepage = await this.loadHomepage();
      if (!homepage) return [];

      const orderedSections = homepage.sectionOrder
        .filter((sectionId) => homepage.sections[sectionId]?.visible)
        .map((sectionId) => {
          const section = homepage.sections[sectionId];
          return {
            id: sectionId,
            type: section.type,
            data: this.translateSectionData(section.data, language),
          };
        });

      return orderedSections;
    } catch (error) {
      logger.error(
        `Failed to get sections by language: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * 섹션 데이터 다국어 변환 - 클라이언트에서 언어 선택 가능하도록 원본 다국어 객체 유지
   */
  private translateSectionData(data: any, language: LanguageCode): any {
    if (!data) return data;

    // 원본 다국어 데이터를 그대로 유지하여 클라이언트에서 언어 변경 가능
    // translateObject 로직을 제거하고 원본 데이터 반환
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * JSON 파일 저장
   */
  private async saveHomepage(data: HomepageData): Promise<void> {
    await fs.writeFile(HOMEPAGE_JSON_PATH, JSON.stringify(data, null, 2));
  }

  /**
   * 백업 생성 (파일 깨짐 방지용)
   */
  private async createBackup(data: HomepageData): Promise<void> {
    try {
      await fs.mkdir(BACKUP_PATH, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `homepage-${timestamp}.json`;
      const backupFilePath = path.join(BACKUP_PATH, backupFileName);

      await fs.writeFile(backupFilePath, JSON.stringify(data, null, 2));

      // 오래된 백업 정리 (최근 5개만 유지)
      await this.cleanupOldBackups();

      logger.info(`Backup created: ${backupFileName}`);
    } catch (error) {
      logger.error(
        `Failed to create backup: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 백업에서 복구
   */
  private async restoreFromBackup(): Promise<HomepageData | null> {
    try {
      const files = await fs.readdir(BACKUP_PATH);
      const backupFiles = files
        .filter(
          (file) => file.startsWith("homepage-") && file.endsWith(".json"),
        )
        .sort()
        .reverse();

      if (backupFiles.length === 0) {
        logger.error("No backup files found");
        return null;
      }

      const latestBackup = backupFiles[0];
      const backupPath = path.join(BACKUP_PATH, latestBackup);
      const content = await fs.readFile(backupPath, "utf-8");
      const data = JSON.parse(content);

      logger.info(`Restored from backup: ${latestBackup}`);
      return data;
    } catch (error) {
      logger.error(
        `Failed to restore from backup: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * 오래된 백업 정리
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.readdir(BACKUP_PATH);
      const backupFiles = files
        .filter(
          (file) => file.startsWith("homepage-") && file.endsWith(".json"),
        )
        .sort();

      if (backupFiles.length > 5) {
        const filesToDelete = backupFiles.slice(0, backupFiles.length - 5);

        for (const file of filesToDelete) {
          await fs.unlink(path.join(BACKUP_PATH, file));
          logger.info(`Old backup deleted: ${file}`);
        }
      }
    } catch (error) {
      logger.error(
        `Failed to cleanup old backups: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 버전 생성
   */
  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, "0")}.${now.getDate().toString().padStart(2, "0")}.${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
  }

  /**
   * 순서 변경 감지 및 적용
   */
  async checkAndApplyOrderChanges(): Promise<boolean> {
    try {
      const homepage = await this.loadHomepage();
      if (!homepage) return false;

      const currentOrderHash = this.hashArray(homepage.sectionOrder);
      const lastOrderedAt = new Date(homepage.metadata.orderedAt);
      const lastUpdated = new Date(homepage.metadata.lastUpdated);

      // 순서가 변경되었는지 확인 (orderedAt과 lastUpdated 비교)
      if (lastUpdated > lastOrderedAt) {
        logger.info("Section order change detected, applying changes...");

        // 메인 페이지에서 순서 재적용 로직
        homepage.metadata.orderedAt = homepage.metadata.lastUpdated;
        await this.saveHomepage(homepage);

        return true;
      }

      return false;
    } catch (error) {
      logger.error(
        `Failed to check order changes: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * 배열 해시 생성
   */
  private hashArray(arr: string[]): string {
    return Buffer.from(arr.join("|")).toString("base64");
  }
}

// 전역 인스턴스
export const homepageManager = new HomepageManager();
