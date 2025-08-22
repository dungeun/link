import { NextRequest, NextResponse } from "next/server";

// Dynamic route configuration
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";

// Dynamic route configuration
import { getServerSession } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; applicantId: string } },
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const { id: campaignId, applicantId } = params;

    // 캠페인 소유자 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { businessId: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "캠페인을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    if (campaign.businessId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 지원 확인
    const application = await prisma.campaignApplication.findUnique({
      where: {
        id: applicantId,
        campaignId: campaignId,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "지원 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 지원 삭제 (소프트 삭제)
    await prisma.campaignApplication.update({
      where: { id: applicantId },
      data: {
        deletedAt: new Date(),
      },
    });

    // 알림 생성 (선택사항)
    await prisma.notification.create({
      data: {
        userId: application.influencerId,
        type: "APPLICATION_DELETED",
        title: "지원 삭제 알림",
        message: `귀하의 캠페인 지원이 삭제되었습니다.`,
        metadata: JSON.stringify({
          campaignId,
          applicationId: applicantId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "지원이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Delete applicant error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "지원 삭제 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
