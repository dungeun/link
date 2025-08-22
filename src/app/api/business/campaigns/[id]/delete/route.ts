import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// API 라우트를 동적으로 설정 (정적 생성 방지)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 인증 미들웨어
async function authenticate(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return null;
  }
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// POST /api/business/campaigns/[id]/delete - 캠페인 삭제
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const userType = user.type?.toLowerCase();
    if (userType !== "business" && userType !== "admin") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 캠페인 존재 여부 및 소유자 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "캠페인을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (
      campaign.businessId !== (user.userId || user.id) &&
      userType !== "admin"
    ) {
      return NextResponse.json(
        { error: "해당 캠페인을 삭제할 권한이 없습니다." },
        { status: 403 },
      );
    }

    // 캠페인 삭제
    await prisma.campaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "캠페인이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("캠페인 삭제 오류:", error);
    return NextResponse.json(
      { error: "캠페인 삭제에 실패했습니다." },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
