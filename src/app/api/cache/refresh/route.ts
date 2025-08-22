import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "@/lib/logger";

const execAsync = promisify(exec);

/**
 * 캐시 새로고침 API
 * 캠페인 생성/수정/삭제 시 자동 호출
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 보안: 내부 호출만 허용 (예: 관리자 API 키 확인)
    const authHeader = request.headers.get("x-cache-refresh-key");
    const expectedKey = process.env.CACHE_REFRESH_KEY || "internal-cache-key";

    if (authHeader !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 캐시 재생성 스크립트 실행
    const { stdout, stderr } = await execAsync(
      "node scripts/generate-cache.js",
    );

    if (stderr) {
      logger.error(`Cache refresh stderr: ${stderr}`);
    }

    const duration = Date.now() - startTime;
    logger.info(`Cache refreshed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Cache refreshed successfully",
      output: stdout,
      duration,
    });
  } catch (error) {
    logger.error(`Cache refresh failed: ${error}`);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh cache",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * 캐시 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");

    const cacheFile = path.join(process.cwd(), "public/cache/campaigns.json");
    const stats = await fs.stat(cacheFile);
    const content = await fs.readFile(cacheFile, "utf-8");
    const cache = JSON.parse(content);

    const age = Date.now() - new Date(cache.generatedAt).getTime();

    return NextResponse.json({
      success: true,
      cache: {
        exists: true,
        generatedAt: cache.generatedAt,
        ageSeconds: Math.floor(age / 1000),
        totalCampaigns: cache.total,
        fileSize: stats.size,
        stale: age > 60000, // 1분 이상
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      cache: {
        exists: false,
        error: "Cache file not found",
      },
    });
  }
}
