import { NextRequest, NextResponse } from "next/server";

// Dynamic route configuration
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db/prisma";

// Dynamic route configuration
import { verifyJWT } from "@/lib/auth/jwt";

// POST /api/campaigns/[id]/save - 관심 캠페인 저장
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      user = await verifyJWT(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !user.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const campaignId = params.id;

    // 캠페인 존재 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "캠페인을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 이미 저장했는지 확인
    const existingSave = await prisma.savedCampaign.findUnique({
      where: {
        userId_campaignId: {
          userId: user.id,
          campaignId: campaignId,
        },
      },
    });

    if (existingSave) {
      return NextResponse.json(
        { error: "이미 저장된 캠페인입니다." },
        { status: 400 },
      );
    }

    // 관심 캠페인 저장
    const savedCampaign = await prisma.savedCampaign.create({
      data: {
        userId: user.id,
        campaignId: campaignId,
      },
    });

    return NextResponse.json({
      message: "캠페인이 저장되었습니다.",
      saved: true,
    });
  } catch (error) {
    console.error("캠페인 저장 오류:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/campaigns/[id]/save - 관심 캠페인 저장 해제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      user = await verifyJWT(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !user.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const campaignId = params.id;

    // 저장된 캠페인 삭제
    await prisma.savedCampaign.delete({
      where: {
        userId_campaignId: {
          userId: user.id,
          campaignId: campaignId,
        },
      },
    });

    return NextResponse.json({
      message: "캠페인 저장이 해제되었습니다.",
      saved: false,
    });
  } catch (error) {
    console.error("캠페인 저장 해제 오류:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/campaigns/[id]/save - 저장 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ saved: false });
    }

    let user;
    try {
      user = await verifyJWT(token);
    } catch (error) {
      return NextResponse.json({ saved: false });
    }

    if (!user || !user.id) {
      return NextResponse.json({ saved: false });
    }

    const campaignId = params.id;

    // 저장 여부 확인
    const savedCampaign = await prisma.savedCampaign.findUnique({
      where: {
        userId_campaignId: {
          userId: user.id,
          campaignId: campaignId,
        },
      },
    });

    return NextResponse.json({
      saved: !!savedCampaign,
    });
  } catch (error) {
    console.error("저장 상태 확인 오류:", error);
    return NextResponse.json({ saved: false });
  }
}
