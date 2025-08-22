import { NextRequest, NextResponse } from "next/server";

// Dynamic route configuration
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";
import { translateText } from "@/lib/services/google-translate.service";
import { invalidateSectionsCache } from "@/lib/cache/sections";

// GET: 카테고리 섹션 가져오기
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const section = await prisma.uISection.findUnique({
      where: { sectionId: "category" },
    });

    if (!section) {
      // 섹션이 없으면 기본값 반환
      return NextResponse.json({
        section: null,
        success: true,
      });
    }

    return NextResponse.json({
      section,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching category section:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch section",
        success: false,
      },
      { status: 500 },
    );
  }
}

// PUT: 카테고리 섹션 생성/업데이트
export async function PUT(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { content, visible, autoTranslate } = body;

    // 기존 섹션 조회
    const existingSection = await prisma.uISection.findUnique({
      where: { sectionId: "category" },
    });

    // 자동 번역 처리
    let translations: Record<string, unknown> = {};

    if (autoTranslate && content?.categories) {
      try {
        translations.en = {
          categories: await Promise.all(
            content.categories.map(async (cat: any) => ({
              ...cat,
              name: cat.name
                ? await translateText(cat.name, "ko", "en").catch(
                    () => cat.name,
                  )
                : cat.name,
              badge: cat.badge
                ? await translateText(cat.badge, "ko", "en").catch(
                    () => cat.badge,
                  )
                : cat.badge,
            })),
          ),
        };

        translations.jp = {
          categories: await Promise.all(
            content.categories.map(async (cat: any) => ({
              ...cat,
              name: cat.name
                ? await translateText(cat.name, "ko", "ja").catch(
                    () => cat.name,
                  )
                : cat.name,
              badge: cat.badge
                ? await translateText(cat.badge, "ko", "ja").catch(
                    () => cat.badge,
                  )
                : cat.badge,
            })),
          ),
        };
      } catch (translationError) {
        console.warn(
          "Translation failed, continuing without translation:",
          translationError,
        );
      }
    }

    let section;

    if (existingSection) {
      // 업데이트
      section = await prisma.uISection.update({
        where: { sectionId: "category" },
        data: {
          type: "category",
          title: "카테고리 메뉴",
          subtitle: "다양한 카테고리를 둘러보세요",
          content: content || {},
          translations: translations as any,
          visible: visible !== undefined ? visible : true,
          order: existingSection.order || 2,
          updatedAt: new Date(),
        },
      });
    } else {
      // 새로 생성
      section = await prisma.uISection.create({
        data: {
          sectionId: "category",
          type: "category",
          title: "카테고리 메뉴",
          subtitle: "다양한 카테고리를 둘러보세요",
          content: content || {},
          translations: translations as any,
          visible: visible !== undefined ? visible : true,
          order: 2,
        },
      });
    }

    // 캐시 무효화
    await invalidateSectionsCache();

    console.log("Category section saved:", section);

    return NextResponse.json({
      section,
      success: true,
    });
  } catch (error) {
    console.error("Error saving category section:", error);
    return NextResponse.json(
      {
        error: "Failed to save section",
        success: false,
      },
      { status: 500 },
    );
  }
}
