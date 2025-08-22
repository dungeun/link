import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  requireAuth,
  createAuthResponse,
  createErrorResponse,
} from "@/lib/auth-middleware";
import {
  paginationSchema,
  campaignCreateSchema,
  ValidationHelper,
} from "@/lib/utils/validation";
import { z } from "zod";
import { createSuccessResponse, handleApiError } from "@/lib/utils/api-error";
import {
  ResponseCache,
  CacheKeyBuilder,
  CachePresets,
} from "@/lib/utils/cache";
import { CampaignCache, CategoryStatsCache } from "@/lib/utils/redis-cache";
import { PerformanceTimer, QueryPerformance } from "@/lib/utils/performance";
import { versionedRouter } from "@/lib/api/versioning";
import { cachedCampaignService } from "@/services/campaign/CachedCampaignService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 캠페인 데이터 타입 정의
interface CampaignWithBusiness {
  id: string;
  businessId: string;
  title: string;
  description: string;
  platform: string;
  budget: number | null;
  targetFollowers: number | null;
  startDate: Date;
  endDate: Date;
  requirements: string | null;
  hashtags: string | null;
  imageUrl: string | null;
  imageId: string | null;
  headerImageUrl: string | null;
  thumbnailImageUrl: string | null;
  productImages: any;
  status: string;
  isPaid: boolean;
  maxApplicants: number;
  rewardAmount: number;
  createdAt: Date;
  updatedAt: Date;
  categories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
    isPrimary: boolean;
  }>;
  _count: {
    applications: number;
  };
  business: {
    id: string;
    name: string;
    businessProfile: {
      companyName: string;
      businessCategory: string;
    } | null;
  };
}

// 최적화된 캠페인 쿼리 함수
async function getOptimizedCampaigns(
  filters: any,
  pagination: any,
  orderBy: any,
) {
  const timer = new PerformanceTimer("campaigns.optimized_query");

  try {
    // 1. 메인 캠페인 데이터 + 비즈니스 정보를 JOIN으로 한 번에 조회
    const campaigns = await QueryPerformance.measure(
      "campaign.findManyWithBusiness",
      async () => {
        return await prisma.campaign.findMany({
          where: filters,
          select: {
            id: true,
            businessId: true,
            title: true,
            description: true,
            platform: true,
            budget: true,
            targetFollowers: true,
            startDate: true,
            endDate: true,
            requirements: true,
            hashtags: true,
            imageUrl: true,
            imageId: true,
            headerImageUrl: true,
            thumbnailImageUrl: true,
            productImages: true,
            status: true,
            isPaid: true,
            maxApplicants: true,
            rewardAmount: true,
            createdAt: true,
            updatedAt: true,
            categories: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                isPrimary: true,
              },
            },
            _count: {
              select: {
                applications: {
                  where: {
                    deletedAt: null,
                  },
                },
              },
            },
            // 비즈니스 정보 JOIN
            business: {
              select: {
                id: true,
                name: true,
                businessProfile: {
                  select: {
                    companyName: true,
                    businessCategory: true,
                  },
                },
              },
            },
          },
          orderBy,
          skip: pagination.offset,
          take: pagination.limit,
        });
      },
      { filters, pagination },
    );

    // 2. 전체 개수 조회 (별도 쿼리이지만 인덱스 최적화됨)
    const total = await QueryPerformance.measure(
      "campaign.count",
      () => prisma.campaign.count({ where: filters }),
      { filters },
    );

    timer.end();
    return { campaigns, total };
  } catch (error) {
    timer.end();
    throw error;
  }
}

// 최적화된 카테고리 통계 조회
async function getOptimizedCategoryStats() {
  return QueryPerformance.measure(
    "category.stats.optimized",
    async () => {
      // 단일 쿼리로 카테고리별 통계 조회 (인덱스 활용)
      const rawStats = await prisma.$queryRaw<
        Array<{
          categoryId: string;
          slug: string;
          name: string;
          campaignCount: bigint;
        }>
      >`
        SELECT 
          cc."categoryId",
          c.slug,
          c.name,
          COUNT(*)::bigint as "campaignCount"
        FROM "campaign_categories" cc
        INNER JOIN "categories" c ON cc."categoryId" = c.id
        INNER JOIN "campaigns" camp ON cc."campaignId" = camp.id
        WHERE camp.status = 'ACTIVE' 
          AND camp."deletedAt" IS NULL
        GROUP BY cc."categoryId", c.slug, c.name
        ORDER BY "campaignCount" DESC
      `;

      // BigInt를 number로 변환
      const stats: Record<string, number> = {};
      rawStats.forEach((stat) => {
        stats[stat.slug] = Number(stat.campaignCount);
      });

      return stats;
    },
    { purpose: "category_stats_single_query" },
  );
}

// 응답 데이터 포맷팅 함수
function formatCampaignResponse(
  campaign: any,
  index?: number,
  isRanking?: boolean,
): any {
  const today = new Date();
  const endDate = new Date(campaign.endDate);
  const timeDiff = endDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  return {
    id: campaign.id,
    title: campaign.title,
    brand:
      campaign.business?.businessProfile?.companyName ||
      campaign.business?.name ||
      "Unknown",
    brand_name:
      campaign.business?.businessProfile?.companyName ||
      campaign.business?.name ||
      "Unknown",
    description: campaign.description || "",
    budget: campaign.budget,
    deadline: Math.max(0, daysDiff),
    category:
      campaign.categories?.find((c: any) => c.isPrimary)?.category?.slug ||
      campaign.categories?.[0]?.category?.slug ||
      "other",
    categoryName:
      campaign.categories?.find((c: any) => c.isPrimary)?.category?.name ||
      campaign.categories?.[0]?.category?.name ||
      "Other",
    platforms: [campaign.platform?.toLowerCase() || "unknown"],
    required_followers: campaign.targetFollowers,
    location: "전국",
    view_count: 0,
    applicants: campaign._count.applications,
    applicant_count: campaign._count.applications,
    maxApplicants: campaign.maxApplicants,
    rewardAmount: campaign.rewardAmount,
    imageUrl:
      campaign.thumbnailImageUrl ||
      campaign.headerImageUrl ||
      campaign.imageUrl ||
      "/images/campaigns/default.jpg",
    image_url:
      campaign.thumbnailImageUrl ||
      campaign.headerImageUrl ||
      campaign.imageUrl ||
      "/images/campaigns/default.jpg",
    tags: parseHashtags(campaign.hashtags),
    status: campaign.status?.toLowerCase() || "unknown",
    created_at: campaign.createdAt?.toISOString() || new Date().toISOString(),
    createdAt: campaign.createdAt?.toISOString() || new Date().toISOString(),
    start_date: campaign.startDate,
    end_date: campaign.endDate,
    requirements: campaign.requirements || "",
    application_deadline: campaign.endDate,
    ...(isRanking && typeof index === "number" && { rank: index + 1 }),
  };
}

// 해시태그 파싱 최적화
function parseHashtags(hashtags: string | null): string[] {
  if (!hashtags) return [];

  try {
    if (typeof hashtags === "string" && hashtags.startsWith("[")) {
      return JSON.parse(hashtags);
    } else if (typeof hashtags === "string") {
      return hashtags.split(" ").filter((tag) => tag && tag.startsWith("#"));
    }
    return [];
  } catch (e) {
    if (typeof hashtags === "string") {
      return hashtags.split(" ").filter((tag) => tag && tag.startsWith("#"));
    }
    return [];
  }
}

// v1 핸들러 - 기존 형식 유지 (하위 호환성)
async function handleGetV1(request: NextRequest) {
  const timer = new PerformanceTimer("api.campaigns.GET.v1");

  try {
    const { searchParams } = new URL(request.url);

    // 파라미터 검증
    const paginationResult = await ValidationHelper.validate(
      {
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "20",
      },
      paginationSchema,
    );

    if (!paginationResult.success) {
      const errors = paginationResult.errors
        ? ValidationHelper.formatErrorMessages(paginationResult.errors)
        : ["Invalid pagination parameters"];
      return createErrorResponse("Invalid pagination parameters", 400, errors);
    }

    const { page, limit } = paginationResult.data!;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");
    const sort = searchParams.get("sort");
    const ranking = searchParams.get("ranking") === "true";
    const recommended = searchParams.get("recommended") === "true";
    const type = searchParams.get("type");
    const businessId = searchParams.get("businessId");
    const offset = (page - 1) * limit;

    // 캐시 확인
    const cachedData = await CampaignCache.get(
      {
        status,
        category,
        platform,
        sort,
        ranking,
        recommended,
        type,
        businessId,
      },
      { page, limit },
    );
    if (cachedData) {
      timer.end();
      return cachedData; // v1에서는 기존 형식 그대로 반환
    }

    // 기존 최적화된 로직 유지
    const where: any = {
      deletedAt: null,
      status: status?.toUpperCase() || "ACTIVE",
    };

    if (businessId) where.businessId = businessId;

    if (category && category !== "all") {
      where.categories = {
        some: {
          category: { slug: category },
        },
      };
    }

    if (platform && platform !== "all") {
      where.platform = platform.toUpperCase();
    }

    let orderBy: any[] = [{ createdAt: "desc" }];

    if (ranking || recommended) {
      if (sort === "deadline") {
        orderBy = [{ endDate: "asc" }];
      } else if (sort === "budget") {
        orderBy = [{ budget: "desc" }];
      }
    }

    if (recommended && type) {
      switch (type) {
        case "trending":
          orderBy = [{ viewCount: "desc" }, { createdAt: "desc" }];
          break;
        case "latest":
          orderBy = [{ createdAt: "desc" }];
          break;
        case "recommended":
        default:
          orderBy = [{ rewardAmount: "desc" }, { createdAt: "desc" }];
          break;
      }
    }

    try {
      const { campaigns, total } = await getOptimizedCampaigns(
        where,
        { offset, limit },
        orderBy,
      );

      const formattedCampaigns = campaigns.map((campaign: any, index: number) =>
        formatCampaignResponse(campaign, index, ranking),
      );

      let categoryStats = await CategoryStatsCache.get();
      if (!categoryStats) {
        categoryStats = await getOptimizedCategoryStats();
        await CategoryStatsCache.set(categoryStats);
      }

      const result = {
        campaigns: formattedCampaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        categoryStats,
      };

      await CampaignCache.set(
        {
          status,
          category,
          platform,
          sort,
          ranking,
          recommended,
          type,
          businessId,
        },
        { page, limit },
        result,
      );

      timer.end();
      return result;
    } catch (queryError) {
      console.error("V1 query error:", queryError);
      timer.end();
      return {
        campaigns: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        categoryStats: {},
      };
    }
  } catch (error) {
    timer.end();
    throw error;
  }
}

// v2 핸들러 - JSON:API 형식 + 추가 메타데이터
async function handleGetV2(request: NextRequest) {
  const timer = new PerformanceTimer("api.campaigns.GET.v2");

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const include = searchParams.get("include")?.split(",") || [];

    // v2에서는 cachedCampaignService 사용
    const result = await cachedCampaignService.listCampaigns(
      { category, status },
      { page, limit },
    );

    // JSON:API 형식으로 응답
    const response = {
      data: result.campaigns.map((campaign) => ({
        id: campaign.id,
        type: "campaign",
        attributes: {
          title: campaign.title,
          description: campaign.description,
          status: campaign.status,
          category:
            campaign.categories?.find((c: any) => c.isPrimary)?.category
              ?.slug || "other",
          targetAmount: campaign.budget,
          currentAmount: campaign.currentAmount || 0,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          imageUrl:
            campaign.thumbnailImageUrl ||
            campaign.headerImageUrl ||
            campaign.imageUrl,
          rewardAmount: campaign.rewardAmount,
          maxApplicants: campaign.maxApplicants,
          applicantCount: campaign._count?.applications || 0,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        },
        relationships: {
          business: {
            data: { id: campaign.businessId, type: "business" },
          },
        },
        links: {
          self: `/api/v2/campaigns/${campaign.id}`,
        },
      })),
      meta: {
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
        },
        filters: {
          category,
          status,
        },
        cache: {
          cached: true,
          layer: "multi-layer",
        },
      },
      links: {
        self: request.url,
        first: `/api/v2/campaigns?page=1&limit=${limit}`,
        last: `/api/v2/campaigns?page=${result.pagination.totalPages}&limit=${limit}`,
        ...(result.pagination.page > 1 && {
          prev: `/api/v2/campaigns?page=${result.pagination.page - 1}&limit=${limit}`,
        }),
        ...(result.pagination.page < result.pagination.totalPages && {
          next: `/api/v2/campaigns?page=${result.pagination.page + 1}&limit=${limit}`,
        }),
      },
    };

    // Include 파라미터 처리 (v2에서만 지원)
    if (include.includes("stats")) {
      response.meta.stats = {
        totalActiveCampaigns: result.campaigns.filter(
          (c) => c.status === "ACTIVE",
        ).length,
        averageTargetAmount:
          result.campaigns.reduce((sum, c) => sum + (c.budget || 0), 0) /
          result.campaigns.length,
        completionRate:
          result.campaigns.reduce(
            (sum, c) => sum + (c.currentAmount || 0) / (c.budget || 1),
            0,
          ) / result.campaigns.length,
      };
    }

    timer.end();
    return response;
  } catch (error) {
    timer.end();
    throw error;
  }
}

// GET 요청 처리 - 버전별 라우팅
export async function GET(request: NextRequest) {
  try {
    return versionedRouter.handle(request, {
      v1: handleGetV1,
      v2: handleGetV2,
    });
  } catch (error) {
    console.error("Campaigns API Error Details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });
    return handleApiError(error, { endpoint: "campaigns", method: "GET" });
  }
}

// v1 POST 핸들러 - 기존 형식 유지
async function handlePostV1(request: NextRequest) {
  const timer = new PerformanceTimer("api.campaigns.POST.v1");
  let user: any = null;

  try {
    const authResult = await requireAuth(request, ["BUSINESS"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    user = authResult;

    const body = await request.json();

    const campaignData = {
      title: body.title,
      description: body.description,
      platform: body.platform || "INSTAGRAM",
      budget: body.budget,
      targetFollowers: body.min_followers || 1000,
      startDate: body.campaign_start_date || new Date().toISOString(),
      endDate:
        body.campaign_end_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: body.requirements,
      hashtags: body.hashtags,
      maxApplicants: body.max_applicants,
      rewardAmount: body.reward_amount || body.budget * 0.8,
      location: body.location || "전국",
    };

    const validationResult = await ValidationHelper.validate(
      campaignData,
      campaignCreateSchema,
    );

    if (!validationResult.success) {
      const errors = ValidationHelper.formatErrorMessages(
        validationResult.errors!,
      );
      return createErrorResponse("Invalid campaign data", 400, errors);
    }

    const validatedData = validationResult.data!;

    const campaign = await QueryPerformance.measure(
      "campaign.create",
      () =>
        prisma.campaign.create({
          data: {
            businessId: user.id,
            title: validatedData.title,
            description: validatedData.description,
            platform: validatedData.platform,
            budget: validatedData.budget,
            targetFollowers: validatedData.targetFollowers,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
            requirements: validatedData.requirements,
            hashtags: validatedData.hashtags
              ? JSON.stringify(validatedData.hashtags)
              : undefined,
            maxApplicants: validatedData.maxApplicants,
            rewardAmount: validatedData.rewardAmount,
            location: validatedData.location,
            status: "DRAFT",
            isPaid: false,
          },
        }),
      { userId: user.id, platform: validatedData.platform },
    );

    // 캐시 무효화
    ResponseCache.invalidateCampaigns();
    ResponseCache.invalidateUser(user.id);
    await CampaignCache.invalidate();
    await CategoryStatsCache.invalidate();

    timer.end();

    return createSuccessResponse(
      campaign,
      "캠페인이 성공적으로 생성되었습니다.",
      201,
    );
  } catch (error) {
    timer.end();
    throw error;
  }
}

// v2 POST 핸들러 - JSON:API 형식 + Event-Driven
async function handlePostV2(request: NextRequest) {
  const timer = new PerformanceTimer("api.campaigns.POST.v2");
  let user: any = null;

  try {
    const authResult = await requireAuth(request, ["BUSINESS"]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    user = authResult;

    const body = await request.json();

    // v2에서는 cachedCampaignService 사용 (Event-Driven 포함)
    const campaign = await cachedCampaignService.createCampaign({
      businessId: user.id,
      title: body.title,
      description: body.description,
      platform: body.platform || "INSTAGRAM",
      budget: body.budget,
      targetFollowers: body.min_followers || 1000,
      startDate: body.campaign_start_date || new Date().toISOString(),
      endDate:
        body.campaign_end_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: body.requirements,
      hashtags: body.hashtags,
      maxApplicants: body.max_applicants,
      rewardAmount: body.reward_amount || body.budget * 0.8,
      location: body.location || "전국",
    });

    timer.end();

    // v2 응답 형식 - JSON:API 규격
    return {
      data: {
        id: campaign.id,
        type: "campaign",
        attributes: {
          title: campaign.title,
          description: campaign.description,
          status: campaign.status,
          category: campaign.category,
          targetAmount: campaign.budget,
          currentAmount: campaign.currentAmount || 0,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          imageUrl: campaign.imageUrl,
          rewardAmount: campaign.rewardAmount,
          maxApplicants: campaign.maxApplicants,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
        },
        relationships: {
          business: {
            data: { id: campaign.businessId, type: "business" },
          },
        },
        links: {
          self: `/api/v2/campaigns/${campaign.id}`,
        },
      },
      meta: {
        message: "Campaign created successfully",
        cache: {
          invalidated: ["campaigns:*"],
        },
        events: {
          published: ["campaign.created"],
        },
      },
    };
  } catch (error) {
    timer.end();
    throw error;
  }
}

// POST 요청 처리 - 버전별 라우팅
export async function POST(request: NextRequest) {
  try {
    return versionedRouter.handle(request, {
      v1: handlePostV1,
      v2: handlePostV2,
    });
  } catch (error) {
    return handleApiError(error, { endpoint: "campaigns", method: "POST" });
  }
}
