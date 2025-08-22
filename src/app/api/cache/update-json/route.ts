/**
 * JSON 캐시 실시간 업데이트 API
 * 어드민에서 섹션 변경 시 JSON 파일을 실시간 업데이트
 */

import { NextRequest, NextResponse } from "next/server";
import { updateJsonFile } from "@/lib/cache/json-loader";
import { invalidatePreloadCache } from "@/lib/cache/preload-service";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, sectionType } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Type and data are required" },
        { status: 400 },
      );
    }

    const basePath = path.join(process.cwd(), "public/cache/dynamic/homepage");
    let updatePaths: string[] = [];
    let success = false;

    switch (type) {
      case "hero":
        const heroPath = path.join(basePath, "hero.json");
        success = await updateJsonFile(heroPath, {
          type: "hero-sections",
          slides: data.slides || [],
        });
        updatePaths.push(heroPath);
        break;

      case "categories":
        const categoriesPath = path.join(basePath, "categories.json");
        success = await updateJsonFile(categoriesPath, {
          type: "category-sections",
          categories: data.categories || [],
        });
        updatePaths.push(categoriesPath);
        break;

      case "sections":
        const sectionsPath = path.join(basePath, "sections.json");
        success = await updateJsonFile(sectionsPath, {
          type: "ui-sections-structure",
          sections: data.sections || [],
          sectionOrder: data.sectionOrder || [],
        });
        updatePaths.push(sectionsPath);

        // 백업도 동시 업데이트
        const backupPath = path.join(basePath, "sections.backup.json");
        await updateJsonFile(backupPath, {
          type: "ui-sections-structure",
          sections: data.sections || [],
          sectionOrder: data.sectionOrder || [],
        });
        break;

      case "ui-text":
        // 정적 UI 텍스트 업데이트
        const { language = "ko", texts } = data;
        const langCode = language === "ja" ? "jp" : language;
        const uiTextPath = path.join(
          process.cwd(),
          "public/cache/static/i18n",
          `ui-${langCode}.json`,
        );
        success = await updateJsonFile(uiTextPath, texts);
        updatePaths.push(uiTextPath);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown update type: ${type}` },
          { status: 400 },
        );
    }

    if (success) {
      // 캐시 무효화
      invalidatePreloadCache();

      // Next.js 페이지 재검증
      revalidatePath("/");
      revalidatePath("/[...slug]");

      logger.info(
        `JSON cache updated successfully: ${type} - paths: ${updatePaths.join(", ")} - dataSize: ${JSON.stringify(data).length}bytes`,
      );

      return NextResponse.json({
        success: true,
        message: `${type} updated successfully`,
        updatedPaths: updatePaths,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error("Failed to update JSON files");
    }
  } catch (error) {
    logger.error(
      `JSON cache update failed: ${error instanceof Error ? error.message : String(error)}`,
    );

    return NextResponse.json(
      {
        error: "Failed to update JSON cache",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  // JSON 캐시 상태 확인
  try {
    const basePath = path.join(process.cwd(), "public/cache");

    return NextResponse.json({
      status: "JSON cache system active",
      timestamp: new Date().toISOString(),
      cachePaths: {
        staticUI: path.join(basePath, "static/i18n"),
        dynamicData: path.join(basePath, "dynamic/homepage"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check cache status" },
      { status: 500 },
    );
  }
}
