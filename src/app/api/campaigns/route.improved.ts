/**
 * Campaign API Routes - 세계 1% 수준 구현
 * Clean Architecture 및 SOLID 원칙 적용
 */

import { NextRequest, NextResponse } from "next/server";
import { campaignService } from "@/services/campaign.service";
import { requireAuth, createAuthResponse } from "@/lib/auth-middleware";
import {
  CampaignFilters,
  PaginationParams,
  SortParams,
  CreateCampaignDTO,
  Money,
  Platform,
  CampaignStatus,
  SortOption,
  CampaignFilterSchema,
  CreateCampaignSchema,
  isCampaignStatus,
  isPlatform,
  isSortOption,
} from "@/types/campaign.types";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";
import { ApiError, handleApiError } from "@/lib/utils/api-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/campaigns - 캠페인 목록 조회
 * 강타입 및 에러 처리 개선
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // 파라미터 파싱 및 검증
    const filters: CampaignFilters = {
      status: searchParams.get("status")
        ? isCampaignStatus(searchParams.get("status")!)
          ? (searchParams.get("status") as CampaignStatus)
          : CampaignStatus.ACTIVE
        : CampaignStatus.ACTIVE,
      category: searchParams.get("category") || undefined,
      platform: searchParams.get("platform")
        ? isPlatform(searchParams.get("platform")!)
          ? (searchParams.get("platform") as Platform)
          : undefined
        : undefined,
      businessId: searchParams.get("businessId") || undefined,
      keyword: searchParams.get("keyword") || undefined,
    };

    // 페이지네이션 파라미터
    const pagination: PaginationParams = {
      page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
      limit: Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
      ),
    };

    // 정렬 파라미터
    const sortField = searchParams.get("sort");
    const sort: SortParams | undefined =
      sortField && isSortOption(sortField)
        ? {
            field: sortField as SortOption,
            order: searchParams.get("order") === "asc" ? "asc" : "desc",
          }
        : undefined;

    // 필터 검증
    const validationResult = CampaignFilterSchema.safeParse(filters);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid filter parameters",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    // 서비스 호출
    const result = (await campaignService.getCampaigns(filters)) as {
      data?: unknown[];
      total?: number;
      page?: number;
      limit?: number;
    };

    // 응답 헤더 설정
    const response = NextResponse.json(result);
    response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
    response.headers.set("X-Total-Count", result.total?.toString() || "0");
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=120");

    logger.info(
      {
        method: "GET",
        path: "/api/campaigns",
        filters,
        pagination,
        sort,
        responseTime: Date.now() - startTime,
        resultCount: result.data?.length || 0,
      },
      "Campaigns fetched successfully",
    );

    return response;
  } catch (error) {
    logger.error(
      {
        method: "GET",
        path: "/api/campaigns",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Failed to fetch campaigns",
    );

    return handleApiError(error, { endpoint: "campaigns", method: "GET" });
  }
}

/**
 * POST /api/campaigns - 캠페인 생성
 * 강타입 및 비즈니스 로직 분리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(request, ["BUSINESS"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    user = authResult;

    // Request body 파싱
    const body = await request.json();

    // DTO 생성
    const campaignData: CreateCampaignDTO = {
      title: body.title,
      description: body.description,
      platform: body.platform || Platform.INSTAGRAM,
      budget: new Money(body.budget || 0),
      targetFollowers: body.targetFollowers || 1000,
      startDate: new Date(body.startDate || Date.now()),
      endDate: new Date(body.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
      requirements: body.requirements,
      hashtags: body.hashtags || [],
      categoryIds: body.categoryIds || [],
      maxApplicants: body.maxApplicants || 100,
      rewardAmount: new Money(body.rewardAmount || body.budget * 0.8),
      location: body.location || "전국",
      images: body.images || [],
    };

    // 입력 검증
    const validationResult = CreateCampaignSchema.safeParse({
      ...campaignData,
      budget: campaignData.budget.amount,
      rewardAmount: campaignData.rewardAmount.amount,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid campaign data",
          details: validationResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    // 서비스 호출
    const campaign = await campaignService.createCampaign(
      campaignData,
      user.id,
    );

    logger.info(
      {
        method: "POST",
        path: "/api/campaigns",
        userId: user.id,
        campaignId: campaign.id,
        responseTime: Date.now() - startTime,
      },
      "Campaign created successfully",
    );

    return NextResponse.json(
      {
        message: "Campaign created successfully",
        data: campaign,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error(
      {
        method: "POST",
        path: "/api/campaigns",
        userId: user?.id,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Failed to create campaign",
    );

    return handleApiError(error, {
      endpoint: "campaigns",
      method: "POST",
      userId: user?.id,
    });
  }
}

/**
 * PUT /api/campaigns/:id - 캠페인 수정
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(request, ["BUSINESS"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    user = authResult;

    // URL에서 ID 추출
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const campaignId = pathParts[pathParts.length - 1];

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 },
      );
    }

    // Request body 파싱
    const body = await request.json();

    // 서비스 호출
    const campaign = await campaignService.updateCampaign(
      campaignId,
      body,
      user.id,
    );

    logger.info(
      {
        method: "PUT",
        path: `/api/campaigns/${campaignId}`,
        userId: user.id,
        campaignId,
        responseTime: Date.now() - startTime,
      },
      "Campaign updated successfully",
    );

    return NextResponse.json({
      message: "Campaign updated successfully",
      data: campaign,
    });
  } catch (error) {
    logger.error(
      {
        method: "PUT",
        path: "/api/campaigns",
        userId: user?.id,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to update campaign",
    );

    return handleApiError(error, {
      endpoint: "campaigns",
      method: "PUT",
      userId: user?.id,
    });
  }
}

/**
 * DELETE /api/campaigns/:id - 캠페인 삭제
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  let user: any = null;

  try {
    // 인증 확인
    const authResult = await requireAuth(request, ["BUSINESS", "ADMIN"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    user = authResult;

    // URL에서 ID 추출
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const campaignId = pathParts[pathParts.length - 1];

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 },
      );
    }

    // 서비스 호출
    await campaignService.deleteCampaign(campaignId, user.id);

    logger.info(
      {
        method: "DELETE",
        path: `/api/campaigns/${campaignId}`,
        userId: user.id,
        campaignId,
        responseTime: Date.now() - startTime,
      },
      "Campaign deleted successfully",
    );

    return NextResponse.json({
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    logger.error(
      {
        method: "DELETE",
        path: "/api/campaigns",
        userId: user?.id,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to delete campaign",
    );

    return handleApiError(error, {
      endpoint: "campaigns",
      method: "DELETE",
      userId: user?.id,
    });
  }
}
