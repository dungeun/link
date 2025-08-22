/**
 * 통합 쿼리 서비스
 * CampaignQueryService, UnifiedCache, 정규화된 데이터, 표준 응답을 통합한 서비스
 */

import { CampaignQueryService } from "./campaign-query.service";
import { CampaignNormalizedService } from "./campaign-normalized.service";
import { UnifiedCache } from "../cache/unified-cache.service";
import {
  ApiResponseService,
  StandardCampaignResponse,
  StandardUserResponse,
} from "./api-response.service";
import { prisma } from "@/lib/prisma";

export interface CampaignListParams {
  page?: number;
  limit?: number;
  status?: string;
  platform?: string;
  businessId?: string;
  category?: string;
  sortBy?: "created" | "budget" | "endDate" | "applications";
  sortOrder?: "asc" | "desc";
  search?: string;
  hashtags?: string[];
  minBudget?: number;
  maxBudget?: number;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  type?: "ADMIN" | "BUSINESS" | "INFLUENCER";
  status?: string;
  verified?: boolean;
  sortBy?: "created" | "lastLogin" | "name";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export class IntegratedQueryService {
  /**
   * 캠페인 목록 조회 (통합 최적화)
   */
  static async getCampaignList(params: CampaignListParams) {
    const {
      page = 1,
      limit = 20,
      status,
      platform,
      businessId,
      category,
      sortBy = "created",
      sortOrder = "desc",
      search,
      hashtags,
      minBudget,
      maxBudget,
    } = params;

    // 캐시 키 생성 (파라미터를 문자열로 변환)
    const cacheIdentifier = `list:${JSON.stringify({
      page,
      limit,
      status,
      platform,
      businessId,
      category,
      sortBy,
      sortOrder,
      search,
      hashtags,
      minBudget,
      maxBudget,
    })}`;

    // 캐시에서 조회
    const cached = await UnifiedCache.campaigns.get<{
      data: any;
      generatedAt: string;
      meta?: any;
    }>(cacheIdentifier);
    if (cached) {
      return ApiResponseService.cached(
        cached.data,
        cacheIdentifier,
        300,
        cached.generatedAt,
        cached.meta,
      );
    }

    // 쿼리 빌더 사용
    const whereClause = this.buildCampaignWhereClause(params);
    const orderByClause = this.buildOrderBy(sortBy, sortOrder);

    // 정규화된 테이블을 포함한 쿼리
    const [campaigns, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        where: whereClause,
        include: {
          business: true,
        },
        orderBy: orderByClause,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where: whereClause }),
    ]);

    // 표준 형식으로 변환
    const transformedCampaigns = campaigns.map((campaign) =>
      ApiResponseService.transformCampaign(campaign),
    );

    const response = ApiResponseService.paginated(
      transformedCampaigns,
      page,
      limit,
      total,
      {
        status,
        platform,
        businessId,
        category,
        search,
        hashtags,
        minBudget,
        maxBudget,
      },
      { field: sortBy, order: sortOrder },
    );

    // 캐시에 저장
    await UnifiedCache.campaigns.set(cacheIdentifier, {
      data: response.data,
      meta: response.meta,
      generatedAt: response.timestamp,
    });

    return response;
  }

  /**
   * 캠페인 상세 조회 (통합 최적화)
   */
  static async getCampaignDetail(campaignId: string) {
    // 캐시에서 조회
    const cacheIdentifier = `detail:${campaignId}`;
    const cached = await UnifiedCache.campaigns.get<{
      data: any;
      generatedAt: string;
      meta?: any;
    }>(cacheIdentifier);

    if (cached) {
      return ApiResponseService.cached(
        cached.data,
        cacheIdentifier,
        600,
        cached.generatedAt,
      );
    }

    // campaign_complete view 사용 (최적화된 JOIN)
    const campaign = await prisma.$queryRaw`
      SELECT * FROM campaign_complete WHERE id = ${campaignId}
    `;

    if (!Array.isArray(campaign) || campaign.length === 0) {
      return ApiResponseService.notFound("Campaign");
    }

    // 정규화된 데이터 추가 조회
    const normalizedData =
      await CampaignNormalizedService.getCampaignWithNormalizedData(campaignId);

    // 데이터 병합
    const campaignData = {
      ...campaign[0],
      ...normalizedData,
    };

    const transformedCampaign =
      ApiResponseService.transformCampaign(campaignData);
    const response = ApiResponseService.success(transformedCampaign);

    // 캐시에 저장 (10분)
    await UnifiedCache.campaigns.set(cacheIdentifier, {
      data: response.data,
      generatedAt: response.timestamp,
    });

    // 조회수 증가 (비동기)
    prisma.campaign
      .update({
        where: { id: campaignId },
        data: { viewCount: { increment: 1 } },
      })
      .catch(console.error);

    return response;
  }

  /**
   * 사용자 목록 조회 (통합 최적화)
   */
  static async getUserList(params: UserListParams) {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      verified,
      sortBy = "created",
      sortOrder = "desc",
      search,
    } = params;

    // 캐시 키 생성
    const cacheIdentifier = `list:${JSON.stringify({
      page,
      limit,
      type,
      status,
      verified,
      sortBy,
      sortOrder,
      search,
    })}`;

    // 캐시에서 조회
    const cached = await UnifiedCache.users.get<{
      data: any;
      generatedAt: string;
      meta?: any;
    }>(cacheIdentifier);
    if (cached) {
      return ApiResponseService.cached(
        cached.data,
        cacheIdentifier,
        600,
        cached.generatedAt,
        cached.meta,
      );
    }

    // user_complete view 사용
    const whereClause = this.buildUserWhereClause(params);
    const orderByClause = this.buildUserOrderBy(sortBy, sortOrder);

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        include: {
          profile: true,
          businessProfile: true,
        },
        orderBy: orderByClause,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    // 표준 형식으로 변환
    const transformedUsers = users.map((user) =>
      ApiResponseService.transformUser(user),
    );

    const response = ApiResponseService.paginated(
      transformedUsers,
      page,
      limit,
      total,
      { type, status, verified, search },
      { field: sortBy, order: sortOrder },
    );

    // 캐시에 저장
    await UnifiedCache.users.set(cacheIdentifier, {
      data: response.data,
      meta: response.meta,
      generatedAt: response.timestamp,
    });

    return response;
  }

  /**
   * 해시태그 기반 캠페인 검색 (정규화된 테이블 사용)
   */
  static async searchCampaignsByHashtags(hashtags: string[], limit = 10) {
    const cacheIdentifier = `hashtag_search:${JSON.stringify({ hashtags, limit })}`;
    const cached = await UnifiedCache.campaigns.get<{
      data: any;
      generatedAt: string;
      meta?: any;
    }>(cacheIdentifier);

    if (cached) {
      return ApiResponseService.cached(
        cached.data,
        cacheIdentifier,
        300,
        cached.generatedAt,
      );
    }

    const campaigns =
      await CampaignNormalizedService.searchByHashtags(hashtags);
    const transformedCampaigns = campaigns.map((campaign) =>
      ApiResponseService.transformCampaign(campaign),
    );

    const response = ApiResponseService.success(transformedCampaigns);

    await UnifiedCache.campaigns.set(cacheIdentifier, {
      data: response.data,
      generatedAt: response.timestamp,
    });

    return response;
  }

  /**
   * 관리자 대시보드 통계 (View 사용)
   */
  static async getAdminDashboardStats() {
    const cacheIdentifier = "dashboard_stats";
    const cached = await UnifiedCache.admin.get<{
      data: any;
      generatedAt: string;
      meta?: any;
    }>(cacheIdentifier);

    if (cached) {
      return ApiResponseService.cached(
        cached.data,
        cacheIdentifier,
        60,
        cached.generatedAt,
      );
    }

    // admin_dashboard_stats view 사용
    const stats = await prisma.$queryRaw`SELECT * FROM admin_dashboard_stats`;
    const response = ApiResponseService.success(
      Array.isArray(stats) ? stats[0] : stats,
    );

    // 1분 캐시
    await UnifiedCache.admin.set(cacheIdentifier, {
      data: response.data,
      generatedAt: response.timestamp,
    });

    return response;
  }

  /**
   * 캠페인 WHERE 절 빌더
   */
  private static buildCampaignWhereClause(params: CampaignListParams) {
    const where: any = {
      deletedAt: null,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.platform) {
      where.campaignPlatforms = {
        some: {
          platform: params.platform,
        },
      };
    }

    if (params.businessId) {
      where.businessId = params.businessId;
    }

    if (params.category) {
      where.categories = {
        some: {
          category: {
            slug: params.category,
          },
        },
      };
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.hashtags && params.hashtags.length > 0) {
      where.campaignHashtags = {
        some: {
          hashtag: {
            in: params.hashtags,
          },
        },
      };
    }

    if (params.minBudget || params.maxBudget) {
      where.OR = [
        {
          budget: {
            ...(params.minBudget && { gte: params.minBudget }),
            ...(params.maxBudget && { lte: params.maxBudget }),
          },
        },
        {
          rewardAmount: {
            ...(params.minBudget && { gte: params.minBudget }),
            ...(params.maxBudget && { lte: params.maxBudget }),
          },
        },
      ];
    }

    return where;
  }

  /**
   * 사용자 WHERE 절 빌더
   */
  private static buildUserWhereClause(params: UserListParams) {
    const where: any = {
      deletedAt: null,
    };

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.verified !== undefined) {
      if (params.verified) {
        where.OR = [
          { profile: { isVerified: true } },
          { businessProfile: { isVerified: true } },
          { type: "ADMIN" },
        ];
      } else {
        where.AND = [
          { type: { not: "ADMIN" } },
          {
            OR: [
              { profile: { isVerified: false } },
              { businessProfile: { isVerified: false } },
            ],
          },
        ];
      }
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * 사용자 ORDER BY 절 빌더
   */
  private static buildUserOrderBy(sortBy: string, sortOrder: "asc" | "desc") {
    switch (sortBy) {
      case "lastLogin":
        return { lastLogin: sortOrder };
      case "name":
        return { name: sortOrder };
      case "created":
      default:
        return { createdAt: sortOrder };
    }
  }

  /**
   * 캐시 무효화 (변경 시 호출)
   */
  static async invalidateCache(
    entityType: "campaign" | "user",
    entityId?: string,
    metadata?: Record<string, any>,
  ) {
    const { CacheInvalidationService } = await import(
      "./cache-invalidation.service"
    );

    await CacheInvalidationService.invalidate({
      type: "update",
      entity: entityType,
      entityId: entityId || "unknown",
      metadata,
    });
  }

  /**
   * 정렬 조건 빌더
   */
  private static buildOrderBy(sortBy: string, sortOrder: string) {
    const order = sortOrder === "asc" ? ("asc" as const) : ("desc" as const);

    switch (sortBy) {
      case "created":
        return { createdAt: order };
      case "budget":
        return { budget: order };
      case "endDate":
        return { endDate: order };
      case "applications":
        return { createdAt: "desc" as const }; // Fallback since relation doesn't exist
      default:
        return { createdAt: "desc" as const };
    }
  }
}
