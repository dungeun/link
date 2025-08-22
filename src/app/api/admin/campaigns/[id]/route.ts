import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyAdminAuth } from "@/lib/auth-utils";

// GET /api/admin/campaigns/[id] - 캠페인 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 관리자 인증 확인
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 401 },
      );
    }

    const campaignId = params.id;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: {
          include: {
            businessProfile: true,
          },
        },
        applications: {
          include: {
            influencer: {
              include: {
                profile: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "캠페인을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("캠페인 조회 오류:", error);
    return NextResponse.json(
      { error: "캠페인 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

// PUT /api/admin/campaigns/[id] - 캠페인 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 관리자 인증 확인
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 401 },
      );
    }

    const campaignId = params.id;
    const body = await request.json();

    console.log("=== API 캠페인 업데이트 요청 ===");
    console.log("캠페인 ID:", campaignId);
    console.log("요청 body:", body);
    console.log("businessId:", body.businessId);

    // 캠페인 존재 확인
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "캠페인을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 날짜 필드 처리
    const updateData: any = {};

    // businessId 변경 처리
    console.log("기존 businessId:", existingCampaign.businessId);
    console.log("새로운 businessId:", body.businessId);
    console.log(
      "businessId 변경 필요:",
      body.businessId !== undefined &&
        body.businessId !== existingCampaign.businessId,
    );

    if (
      body.businessId !== undefined &&
      body.businessId !== existingCampaign.businessId
    ) {
      console.log("업체 변경 감지 - 유효성 검사 시작");

      // null 또는 빈 문자열인 경우 업체 해제
      if (body.businessId === null || body.businessId === "") {
        console.log("업체 해제 - businessId를 null로 설정");
        updateData.businessId = null;
      } else {
        // 새로운 업체(BUSINESS 타입 사용자) 존재 확인
        const businessExists = await prisma.user.findUnique({
          where: {
            id: body.businessId,
            type: "BUSINESS",
          },
        });
        console.log("업체 존재 여부:", !!businessExists);

        if (!businessExists) {
          console.log("업체를 찾을 수 없음:", body.businessId);

          // 디버깅용: 모든 BUSINESS 타입 사용자 조회
          const allBusinesses = await prisma.user.findMany({
            where: { type: "BUSINESS" },
            select: { id: true, name: true, email: true },
          });
          console.log("데이터베이스의 모든 BUSINESS 사용자:", allBusinesses);

          return NextResponse.json(
            { error: `선택한 업체를 찾을 수 없습니다. ID: ${body.businessId}` },
            { status: 404 },
          );
        }
        console.log("업체 변경 승인 - updateData에 businessId 추가");
        updateData.businessId = body.businessId;
      }
    } else if (body.businessId !== undefined) {
      console.log("업체 ID가 동일하여 변경하지 않음");
    }

    // 기본 필드들
    const simpleFields = [
      "title",
      "description",
      "platform",
      "status",
      "requirements",
      "hashtags",
      "keywords",
      "imageUrl",
      "headerImageUrl",
      "thumbnailImageUrl",
      "youtubeUrl",
      "provisionDetails",
      "campaignMission",
      "additionalNotes",
      "productImages",
      "detailImages",
    ];

    simpleFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // 숫자 필드들
    const numberFields = [
      "budget",
      "targetFollowers",
      "maxApplicants",
      "platformFeeRate",
    ];

    numberFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = Number(body[field]);
      }
    });

    // 불린 필드
    if (body.isPaid !== undefined) {
      updateData.isPaid = Boolean(body.isPaid);
    }

    // 날짜 필드들
    const dateFields = [
      "startDate",
      "endDate",
      "applicationStartDate",
      "applicationEndDate",
      "contentStartDate",
      "contentEndDate",
    ];

    dateFields.forEach((field) => {
      if (body[field] !== undefined && body[field] !== null) {
        // ISO 8601 형식으로 변환
        updateData[field] = new Date(body[field]);
      }
    });

    // platforms 배열 처리 (JSON 필드)
    if (body.platforms !== undefined) {
      updateData.platforms = body.platforms;
    }

    console.log("최종 updateData:", updateData);
    console.log("데이터베이스 업데이트 실행");

    // 캠페인 업데이트
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        business: {
          include: {
            businessProfile: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    console.log(
      "업데이트 완료 - 새로운 businessId:",
      updatedCampaign.businessId,
    );

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 수정되었습니다.",
      campaign: updatedCampaign,
    });
  } catch (error) {
    console.error("캠페인 수정 오류:", error);
    return NextResponse.json(
      { error: "캠페인 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/campaigns/[id] - 캠페인 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // 관리자 인증 확인
    const authResult = await verifyAdminAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 401 },
      );
    }

    const campaignId = params.id;

    // 캠페인 존재 확인 및 관련 데이터 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "캠페인을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 지원자가 있는 경우 삭제 방지
    if (campaign._count.applications > 0) {
      return NextResponse.json(
        { error: "지원자가 있는 캠페인은 삭제할 수 없습니다." },
        { status: 400 },
      );
    }

    // 캠페인 삭제
    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    return NextResponse.json({
      success: true,
      message: "캠페인이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("캠페인 삭제 오류:", error);
    return NextResponse.json(
      { error: "캠페인 삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
