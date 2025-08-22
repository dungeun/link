import { NextRequest, NextResponse } from "next/server";

// Dynamic route configuration
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";

// Dynamic route configuration
// 기본 번역 매핑 (Google Translate 없이 사용)
const basicTranslations: Record<string, { en: string; jp: string }> = {
  캠페인: { en: "Campaign", jp: "キャンペーン" },
  병원: { en: "Hospital", jp: "病院" },
  구매평: { en: "Review", jp: "レビュー" },
  이벤트: { en: "Event", jp: "イベント" },
  상품: { en: "Product", jp: "商品" },
  문의: { en: "Inquiry", jp: "お問い合わせ" },
  공지사항: { en: "Notice", jp: "お知らせ" },
  고객센터: { en: "Customer Center", jp: "カスタマーセンター" },
  서비스: { en: "Service", jp: "サービス" },
  회사소개: { en: "About Us", jp: "会社概要" },
};

// 간단한 토큰 기반 인증 (개발용)
function validateToken(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  // 실제로는 JWT 검증을 해야 하지만, 개발 중이므로 간단히 처리
  return true;
}

// POST /api/admin/language-packs/simple-create - 간단한 언어팩 생성
export async function POST(request: NextRequest) {
  try {
    // 간단한 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!validateToken(authHeader)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, ko, category } = body;

    // 필수 파라미터 확인
    if (!key || !ko || !category) {
      return NextResponse.json(
        { error: "Key, Korean text, and category are required" },
        { status: 400 },
      );
    }

    // 기존 키 중복 확인
    const existingKey = await prisma.languagePack.findUnique({
      where: { key },
    });

    if (existingKey) {
      return NextResponse.json(
        { error: "Language pack key already exists" },
        { status: 409 },
      );
    }

    // 기본 번역 찾기 또는 기본값 사용
    const translation = basicTranslations[ko] || { en: ko, jp: ko };

    // 언어팩 생성
    const languagePack = await prisma.languagePack.create({
      data: {
        key,
        ko,
        en: translation.en,
        jp: translation.jp,
        category,
        description: `Menu item: ${ko}`,
        isEditable: true,
      },
    });

    console.log("Language pack created (simple):", languagePack);

    return NextResponse.json({
      success: true,
      key: languagePack.key,
      ko: languagePack.ko,
      en: languagePack.en,
      ja: languagePack.jp,
    });
  } catch (error) {
    console.error("Simple language pack creation error:", error);
    return NextResponse.json(
      { error: "Failed to create language pack" },
      { status: 500 },
    );
  }
}
