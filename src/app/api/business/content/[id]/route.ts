import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyJWT } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/business/content/[id] - 지원자의 콘텐츠 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const user = await verifyJWT(token);
    if (
      user.type?.toUpperCase() !== "BUSINESS" &&
      user.type?.toUpperCase() !== "ADMIN"
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 지원서 조회 (해당 비즈니스의 캠페인인지 확인)
    const application = await prisma.campaignApplication.findUnique({
      where: { id: params.id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            businessId: true,
          },
        },
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contents: {
          include: {
            media: {
              include: {
                file: {
                  select: {
                    id: true,
                    url: true,
                    filename: true,
                    originalName: true,
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "지원서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 권한 확인 (해당 캠페인의 소유자인지)
    if (
      application.campaign.businessId !== user.id &&
      user.type?.toUpperCase() !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "해당 콘텐츠를 볼 권한이 없습니다." },
        { status: 403 },
      );
    }

    // 제출된 콘텐츠가 있는지 확인
    const content =
      application.contents && application.contents.length > 0
        ? application.contents[0]
        : null;

    if (!content) {
      return NextResponse.json({
        application: {
          id: application.id,
          campaignTitle: application.campaign.title,
          influencerName: application.influencer.name,
          status: application.status,
          hasContent: false,
        },
      });
    }

    // 응답 데이터 포맷팅
    const formattedContent = {
      id: content.id,
      title: application.campaign.title,
      status: content.status,
      createdAt: content.createdAt.toISOString().split("T")[0],
      reviewedAt: content.reviewedAt?.toISOString().split("T")[0],
      url: content.contentUrl,
      description: content.description,
      platform: content.platform,
      feedback: content.feedback,
      applicationId: application.id,
      campaignId: application.campaign.id,
      campaignTitle: application.campaign.title,
      influencerName: application.influencer.name,
      media:
        content.media?.map((m) => ({
          id: m.id,
          url: m.file.url,
          type: m.type,
          order: m.order,
          filename: m.file.originalName || m.file.filename,
        })) || [],
    };

    return NextResponse.json({
      application: {
        id: application.id,
        campaignTitle: application.campaign.title,
        influencerName: application.influencer.name,
        status: application.status,
        hasContent: true,
      },
      content: formattedContent,
    });
  } catch (error) {
    console.error("Business content API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/business/content/[id] - 콘텐츠 승인/거절
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    const user = await verifyJWT(token);
    if (
      user.type?.toUpperCase() !== "BUSINESS" &&
      user.type?.toUpperCase() !== "ADMIN"
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { status, feedback } = await request.json();

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 지원서 조회
    const application = await prisma.campaignApplication.findUnique({
      where: { id: params.id },
      include: {
        campaign: {
          select: {
            businessId: true,
          },
        },
        contents: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "지원서를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 권한 확인
    if (
      application.campaign.businessId !== user.id &&
      user.type?.toUpperCase() !== "ADMIN"
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const content =
      application.contents && application.contents.length > 0
        ? application.contents[0]
        : null;

    if (!content) {
      return NextResponse.json(
        { error: "제출된 콘텐츠가 없습니다." },
        { status: 404 },
      );
    }

    // 콘텐츠 상태 업데이트
    const updatedContent = await prisma.content.update({
      where: { id: content.id },
      data: {
        status,
        feedback,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      content: updatedContent,
    });
  } catch (error) {
    console.error("Content status update API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
