import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";
import { sampleLanguagePacks } from "../sample-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/admin/language-packs/init - 샘플 언어팩 데이터 초기화
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    // 기존 샘플 데이터 확인
    const existingCount = await prisma.languagePack.count({
      where: {
        key: {
          in: sampleLanguagePacks.map((pack) => pack.key),
        },
      },
    });

    if (existingCount > 0) {
      return NextResponse.json({
        message: `이미 ${existingCount}개의 샘플 언어팩이 존재합니다.`,
        existing: existingCount,
        total: sampleLanguagePacks.length,
      });
    }

    // 샘플 데이터 일괄 생성
    const created = await prisma.languagePack.createMany({
      data: sampleLanguagePacks.map((pack) => ({
        id: pack.id,
        key: pack.key,
        ko: pack.ko,
        en: pack.en,
        jp: pack.ja, // ja -> jp로 변환
        category: pack.category,
        subcategory: pack.subcategory,
        isEditable: true,
        description: `${pack.subcategory || pack.category} 관련 언어팩`,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: `${created.count}개의 샘플 언어팩이 생성되었습니다.`,
      created: created.count,
      categories: {
        campaigns: sampleLanguagePacks.filter((p) => p.category === "campaigns")
          .length,
        posts: sampleLanguagePacks.filter((p) => p.category === "posts").length,
        menus: sampleLanguagePacks.filter((p) => p.category === "menus").length,
        sections: sampleLanguagePacks.filter((p) => p.category === "sections")
          .length,
      },
    });
  } catch (error) {
    console.error("언어팩 초기화 오류:", error);
    return NextResponse.json(
      {
        error: "언어팩 초기화에 실패했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/admin/language-packs/init - 현재 언어팩 통계 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    // 카테고리별 통계
    const stats = await prisma.languagePack.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
    });

    // 카테고리별 통계만 제공 (서브카테고리 필드가 존재하지 않음)
    const subStats: any[] = [];

    // 총 언어팩 수
    const total = await prisma.languagePack.count();

    // 번역 완료율
    const translationStats = await prisma.languagePack.aggregate({
      _count: {
        id: true,
      },
      where: {
        AND: [{ ko: { not: "" } }, { en: { not: "" } }, { jp: { not: "" } }],
      },
    });

    return NextResponse.json({
      total,
      translationComplete: translationStats._count.id,
      translationRate:
        total > 0 ? Math.round((translationStats._count.id / total) * 100) : 0,
      categories: stats.reduce(
        (acc, stat) => {
          acc[stat.category] = stat._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
      subcategories: subStats.reduce(
        (acc, stat) => {
          const key = `${stat.category}.${stat.subcategory}`;
          acc[key] = stat._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    });
  } catch (error) {
    console.error("언어팩 통계 조회 오류:", error);
    return NextResponse.json(
      { error: "통계 조회에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
