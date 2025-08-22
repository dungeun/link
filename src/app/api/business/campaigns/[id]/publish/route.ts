import { NextRequest, NextResponse } from "next/server";

// Dynamic route configuration
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";

// Dynamic route configuration
import { withAuth } from "@/lib/auth/middleware";

// POST /api/business/campaigns/[id]/publish - 캠페인 활성화
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await withAuth(request, ["BUSINESS", "ADMIN"]);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const campaignId = params.id;

    // 캠페인 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "캠페인을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 권한 확인
    if (campaign.businessId !== user.id && user.type !== "ADMIN") {
      return NextResponse.json(
        { error: "이 캠페인을 활성화할 권한이 없습니다." },
        { status: 403 },
      );
    }

    // 캠페인 활성화
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "ACTIVE",
        isPaid: true,
      },
    });

    return NextResponse.json({
      message: "캠페인이 활성화되었습니다.",
      campaign: updatedCampaign,
    });
  } catch (error) {
    const { logError } = await import("@/lib/utils/logger");
    logError(error, "캠페인 활성화 오류");
    return NextResponse.json(
      { error: "캠페인 활성화에 실패했습니다." },
      { status: 500 },
    );
  }
}
