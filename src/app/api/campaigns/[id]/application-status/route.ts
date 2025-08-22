import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyJWT } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/campaigns/[id]/application-status - 캠페인 지원 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 인증 확인
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const user = await verifyJWT(token);
    if (!user || user.type !== "INFLUENCER") {
      return NextResponse.json(
        { error: "인플루언서만 확인할 수 있습니다." },
        { status: 403 },
      );
    }

    // 지원 내역 확인
    const application = await prisma.campaignApplication.findUnique({
      where: {
        campaignId_influencerId: {
          campaignId: params.id,
          influencerId: user.id,
        },
      },
    });

    if (!application) {
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({
      status: application.status,
      appliedAt: application.createdAt,
      reviewedAt: application.reviewedAt,
      rejectionReason: application.rejectionReason,
    });
  } catch (error) {
    console.error("지원 상태 확인 오류:", error);
    return NextResponse.json(
      { error: "지원 상태 확인에 실패했습니다." },
      { status: 500 },
    );
  }
}
