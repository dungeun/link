import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";
import { translationService } from "@/lib/services/translation.service";
import { i18nBackupManager } from "@/lib/cache/json-backup-manager";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/admin/translations - 번역 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "campaign";
    const untranslatedOnly = searchParams.get("untranslatedOnly") === "true";

    let data: Array<Record<string, unknown>> = [];

    if (type === "campaign") {
      // 캠페인 번역 데이터 조회
      const campaigns = await prisma.campaign.findMany({
        include: {
          campaignTranslations: true,
        },
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      data = campaigns.map((campaign) => ({
        id: campaign.id,
        type: "campaign",
        originalId: campaign.id,
        ko: campaign.title,
        en:
          campaign.campaignTranslations.find((t) => t.language === "en")
            ?.title || "",
        jp:
          campaign.campaignTranslations.find((t) => t.language === "ja")
            ?.title || "", // ja로 저장된 데이터를 jp 필드로 반환
        isAutoTranslated: {
          en:
            campaign.campaignTranslations.find((t) => t.language === "en")
              ?.isAutoTranslated ?? true,
          jp:
            campaign.campaignTranslations.find((t) => t.language === "ja")
              ?.isAutoTranslated ?? true, // ja로 저장된 데이터를 jp 필드로 반환
        },
      }));
    } else if (type === "post") {
      // 게시물 번역 데이터 조회
      const posts = await prisma.post.findMany({
        include: {
          postTranslations: true,
        },
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      data = posts.map((post) => ({
        id: post.id,
        type: "post",
        originalId: post.id,
        ko: post.title,
        en: post.postTranslations.find((t) => t.language === "en")?.title || "",
        jp: post.postTranslations.find((t) => t.language === "ja")?.title || "", // ja로 저장된 데이터를 jp 필드로 반환
        isAutoTranslated: {
          en:
            post.postTranslations.find((t) => t.language === "en")
              ?.isAutoTranslated ?? true,
          jp:
            post.postTranslations.find((t) => t.language === "ja")
              ?.isAutoTranslated ?? true, // ja로 저장된 데이터를 jp 필드로 반환
        },
      }));
    } else if (type === "menu") {
      // 메뉴 관련 LanguagePack 데이터만 조회
      const whereClause: Record<string, unknown> = {
        OR: [
          { category: "ui_menu" },
          { category: "ui_action" },
          { category: "ui_notification" },
        ],
      };

      const languagePacks = await prisma.languagePack.findMany({
        where: whereClause,
        orderBy: [{ category: "asc" }, { key: "asc" }],
      });

      let filteredPacks = languagePacks;

      // 번역되지 않은 항목만 필터링 (JavaScript로 필터링)
      if (untranslatedOnly) {
        filteredPacks = languagePacks.filter((pack) => {
          const enMissing =
            !pack.en || pack.en === pack.ko || pack.en.trim() === "";
          const jpMissing =
            !pack.jp || pack.jp === pack.ko || pack.jp.trim() === "";
          return enMissing || jpMissing;
        });
      }

      data = filteredPacks.map((pack) => ({
        id: pack.id,
        type: "menu",
        originalId: pack.id,
        ko: pack.ko,
        en: pack.en,
        jp: pack.jp,
        key: pack.key,
        category: pack.category,
        isAutoTranslated: {
          en: false,
          jp: false,
        },
      }));
    } else if (type === "main-sections") {
      // 메인 섹션 관련 LanguagePack 데이터만 조회
      const whereClause: Record<string, unknown> = {
        OR: [
          { category: "ui_hero" },
          { category: "ui_category" },
          { category: "ui_quicklink" },
          { category: "ui_promo" },
          { category: "ui_ranking" },
          { category: "ui_footer" },
        ],
      };

      const languagePacks = await prisma.languagePack.findMany({
        where: whereClause,
        orderBy: [{ category: "asc" }, { key: "asc" }],
      });

      let filteredPacks = languagePacks;

      // 번역되지 않은 항목만 필터링 (JavaScript로 필터링)
      if (untranslatedOnly) {
        filteredPacks = languagePacks.filter((pack) => {
          const enMissing =
            !pack.en || pack.en === pack.ko || pack.en.trim() === "";
          const jpMissing =
            !pack.jp || pack.jp === pack.ko || pack.jp.trim() === "";
          return enMissing || jpMissing;
        });
      }

      data = filteredPacks.map((pack) => ({
        id: pack.id,
        type: "main-sections",
        originalId: pack.id,
        ko: pack.ko,
        en: pack.en,
        jp: pack.jp,
        key: pack.key,
        category: pack.category,
        isAutoTranslated: {
          en: false,
          jp: false,
        },
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("번역 데이터 조회 오류:", error);
    return NextResponse.json(
      { error: "번역 데이터 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// PUT /api/admin/translations/[id] - 번역 수정
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { id, en, jp, ja, type } = body;

    if (type === "campaign") {
      // 영어 번역 업데이트 또는 생성
      if (en !== undefined) {
        await prisma.campaignTranslation.upsert({
          where: {
            campaignId_language: {
              campaignId: id,
              language: "en",
            },
          },
          update: {
            title: en,
            isAutoTranslated: true, // 자동 번역으로 설정
            lastEditedBy: authResult.user.id,
            editedAt: new Date(),
          },
          create: {
            campaignId: id,
            language: "en",
            title: en,
            description: "",
            hashtags: [],
            isAutoTranslated: true, // 자동 번역으로 설정
            lastEditedBy: authResult.user.id,
            editedAt: new Date(),
          },
        });
      }

      // 일본어 번역 업데이트 또는 생성
      if (ja !== undefined || jp !== undefined) {
        const jpValue = ja || jp; // Support both ja and jp for backward compatibility
        await prisma.campaignTranslation.upsert({
          where: {
            campaignId_language: {
              campaignId: id,
              language: "ja",
            },
          },
          update: {
            title: jpValue,
            isAutoTranslated: true, // 자동 번역으로 설정
            lastEditedBy: authResult.user.id,
            editedAt: new Date(),
          },
          create: {
            campaignId: id,
            language: "ja",
            title: jpValue,
            description: "",
            hashtags: [],
            isAutoTranslated: true, // 자동 번역으로 설정
            lastEditedBy: authResult.user.id,
            editedAt: new Date(),
          },
        });
      }
    } else if (type === "post") {
      // 게시물 번역 처리
      if (en !== undefined) {
        await prisma.postTranslation.upsert({
          where: {
            postId_language: {
              postId: id,
              language: "en",
            },
          },
          update: {
            title: en,
            isAutoTranslated: false,
            lastEditedBy: authResult.user.id,
            editedAt: new Date(),
          },
          create: {
            postId: id,
            language: "en",
            title: en,
            content: "",
            isAutoTranslated: false,
            lastEditedBy: authResult.user.id,
            editedAt: new Date(),
          },
        });
      }

      if (ja !== undefined || jp !== undefined) {
        const jpValue = ja || jp; // Support both ja and jp for backward compatibility
        await prisma.postTranslation.upsert({
          where: {
            postId_language: {
              postId: id,
              language: "ja",
            },
          },
          update: {
            title: jpValue,
            isAutoTranslated: false,
            lastEditedBy: authResult.user.id,
            editedAt: new Date(),
          },
          create: {
            postId: id,
            language: "ja",
            title: jpValue,
            content: "",
            isAutoTranslated: false,
            lastEditedBy: authResult.user.id,
            editedAt: new Date(),
          },
        });
      }
    } else if (type === "menu" || type === "main-sections") {
      // 메뉴 (LanguagePack) 업데이트
      const jpValue = ja || jp; // Support both ja and jp for backward compatibility
      await prisma.languagePack.update({
        where: { id },
        data: {
          en: en || undefined,
          jp: jpValue || undefined,
        },
      });
    }

    // JSON 언어팩 백업 생성
    try {
      if (type === "menu" || type === "main-sections") {
        // LanguagePack 전체 데이터 백업
        const allLanguagePacks = await prisma.languagePack.findMany({
          orderBy: [{ category: "asc" }, { key: "asc" }],
        });

        const languagePackData = {
          languagePacks: allLanguagePacks,
          lastUpdated: new Date().toISOString(),
          type: type,
        };

        await i18nBackupManager.saveWithBackup(
          `${type}-language-packs.json`,
          languagePackData,
          "language-packs",
        );
        logger.info(
          `Language packs backed up after translation update: ${type}`,
        );
      } else {
        // 캠페인/포스트 번역 데이터는 dynamic으로 분류
        const translationData = {
          updatedItem: { id, type, en, jp: jp || ja },
          lastUpdated: new Date().toISOString(),
          type: type,
        };

        await i18nBackupManager.saveWithBackup(
          `${type}-translations.json`,
          translationData,
          "translations",
        );
        logger.info(`Translation data backed up after update: ${type} - ${id}`);
      }
    } catch (backupError) {
      logger.error(
        `Failed to backup translation data: ${backupError instanceof Error ? backupError.message : String(backupError)}`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("번역 수정 오류:", error);
    return NextResponse.json(
      { error: "번역 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
