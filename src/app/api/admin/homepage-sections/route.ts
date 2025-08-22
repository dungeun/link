import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { homepageManager } from "@/lib/cache/homepage-manager";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET: 모든 섹션 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const language =
      (searchParams.get("language") as "ko" | "en" | "jp") || "ko";

    if (language !== "ko") {
      // 언어별 섹션 데이터
      const sections = await homepageManager.getSectionsByLanguage(language);
      return NextResponse.json({
        sections,
        success: true,
      });
    } else {
      // 전체 Homepage 데이터 (관리용)
      const homepage = await homepageManager.loadHomepage();
      return NextResponse.json({
        homepage,
        success: true,
      });
    }
  } catch (error) {
    logger.error(
      `Error fetching homepage sections: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      {
        error: "Failed to fetch sections",
        success: false,
      },
      { status: 500 },
    );
  }
}

// POST: 새 섹션 생성, 업데이트 또는 번역 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { action, sectionId, type, visible, data, targetLanguage } = body;

    if (action === "translate") {
      // 번역 생성 (저장하지 않고 미리보기용)
      if (!sectionId || !data || !targetLanguage) {
        return NextResponse.json(
          {
            error:
              "sectionId, data, and targetLanguage are required for translation",
            success: false,
          },
          { status: 400 },
        );
      }

      const translatedData = await homepageManager.generateSectionTranslation(
        sectionId,
        data,
        targetLanguage,
      );

      if (translatedData) {
        return NextResponse.json({
          success: true,
          translatedData,
          message: `Translation generated for ${targetLanguage}`,
        });
      } else {
        return NextResponse.json(
          {
            error: "Failed to generate translation",
            success: false,
          },
          { status: 500 },
        );
      }
    } else {
      // 기존 섹션 저장 로직 (관리자가 저장 버튼 클릭시)
      if (!sectionId || !type || !data) {
        return NextResponse.json(
          {
            error: "sectionId, type, and data are required",
            success: false,
          },
          { status: 400 },
        );
      }

      const success = await homepageManager.updateSection({
        sectionId,
        type,
        visible,
        data,
      });

      if (success) {
        logger.info(`Homepage section saved by admin: ${sectionId}`);

        return NextResponse.json({
          success: true,
          message: `Section ${sectionId} saved successfully`,
        });
      } else {
        return NextResponse.json(
          {
            error: "Failed to save section",
            success: false,
          },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    logger.error(
      `Error in homepage section POST: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      {
        error: "Failed to process request",
        success: false,
      },
      { status: 500 },
    );
  }
}

// PUT: 섹션 순서 업데이트
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const body = await request.json();
    const { action, sectionOrder, sectionId } = body;

    if (action === "reorder") {
      if (!sectionOrder || !Array.isArray(sectionOrder)) {
        return NextResponse.json(
          {
            error: "sectionOrder array is required",
            success: false,
          },
          { status: 400 },
        );
      }

      const success = await homepageManager.updateSectionOrder(sectionOrder);

      if (success) {
        return NextResponse.json({
          success: true,
          message: "Section order updated successfully",
        });
      } else {
        return NextResponse.json(
          {
            error: "Failed to update section order",
            success: false,
          },
          { status: 500 },
        );
      }
    } else if (action === "toggle") {
      if (!sectionId) {
        return NextResponse.json(
          {
            error: "sectionId is required for toggle action",
            success: false,
          },
          { status: 400 },
        );
      }

      const success = await homepageManager.toggleSectionVisibility(sectionId);

      if (success) {
        return NextResponse.json({
          success: true,
          message: `Section ${sectionId} visibility toggled`,
        });
      } else {
        return NextResponse.json(
          {
            error: "Failed to toggle section visibility",
            success: false,
          },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        {
          error: 'Invalid action. Use "reorder" or "toggle"',
          success: false,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    logger.error(
      `Error in homepage section PUT: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      {
        error: "Failed to process request",
        success: false,
      },
      { status: 500 },
    );
  }
}

// DELETE: 섹션 숨김 (실제 삭제하지 않고 visible: false)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");

    if (!sectionId) {
      return NextResponse.json(
        {
          error: "sectionId is required",
          success: false,
        },
        { status: 400 },
      );
    }

    const success = await homepageManager.toggleSectionVisibility(sectionId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Section ${sectionId} hidden successfully`,
      });
    } else {
      return NextResponse.json(
        {
          error: "Failed to hide section",
          success: false,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error(
      `Error hiding homepage section: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      {
        error: "Failed to hide section",
        success: false,
      },
      { status: 500 },
    );
  }
}
