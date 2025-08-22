import { prisma } from "@/lib/db/prisma";
import { cache, CACHE_TTL, CACHE_PREFIX } from "@/lib/cache/enhanced-cache";
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from "@/lib/errors/application-errors";
import { logger } from "@/lib/logger";

/**
 * 캠페인 서비스 - 비즈니스 로직 캡슐화
 */
export class CampaignService {
  private static instance: CampaignService;

  private constructor() {}

  static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  /**
   * 캠페인 목록 조회
   */
  async getCampaigns(params: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const {
      status = "active",
      category,
      page = 1,
      limit = 20,
      search,
    } = params;

    // 캐시 키 생성
    const cacheKey = `${CACHE_PREFIX.CAMPAIGN}list:${JSON.stringify(params)}`;

    // 캐시 확인
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug("Campaign list cache hit");
      return cached;
    }

    // 쿼리 조건 생성
    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // 데이터베이스 조회
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    const result = {
      campaigns,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 캐시 저장
    await cache.set(cacheKey, result, CACHE_TTL.SHORT);

    return result;
  }

  /**
   * 캠페인 상세 조회
   */
  async getCampaignById(id: string) {
    const cacheKey = `${CACHE_PREFIX.CAMPAIGN}detail:${id}`;

    // 캐시 확인
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Campaign detail cache hit: ${id}`);
      return cached;
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        business: {
          include: {
            businessProfile: true,
          },
        },
        applications: {
          include: {
            influencer: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError("캠페인");
    }

    // 캐시 저장
    await cache.set(cacheKey, campaign, CACHE_TTL.MEDIUM);

    return campaign;
  }

  /**
   * 캠페인 생성
   */
  async createCampaign(data: any, businessId: string) {
    // 유효성 검사
    this.validateCampaignData(data);

    // 캠페인 생성
    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        businessId,
        status: "draft",
      },
    });

    // 캐시 무효화
    await cache.invalidate(CACHE_PREFIX.CAMPAIGN);

    logger.info(`Campaign created: ${campaign.id}`);

    return campaign;
  }

  /**
   * 캠페인 업데이트
   */
  async updateCampaign(id: string, data: any, userId: string) {
    // 캠페인 존재 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundError("캠페인");
    }

    // 권한 확인
    if (campaign.businessId !== userId) {
      throw new AuthorizationError("이 캠페인을 수정할 권한이 없습니다");
    }

    // 업데이트
    const updated = await prisma.campaign.update({
      where: { id },
      data,
    });

    // 캐시 무효화
    await cache.delete(`${CACHE_PREFIX.CAMPAIGN}*`);

    logger.info(`Campaign updated: ${id}`);

    return updated;
  }

  /**
   * 캠페인 삭제
   */
  async deleteCampaign(id: string, userId: string) {
    // 캠페인 존재 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundError("캠페인");
    }

    // 권한 확인
    if (campaign.businessId !== userId) {
      throw new AuthorizationError("이 캠페인을 삭제할 권한이 없습니다");
    }

    // 진행 중인 신청이 있는지 확인
    const activeApplications = await prisma.campaignApplication.count({
      where: {
        campaignId: id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (activeApplications > 0) {
      throw new ValidationError(
        "진행 중인 신청이 있는 캠페인은 삭제할 수 없습니다",
      );
    }

    // 삭제
    await prisma.campaign.delete({
      where: { id },
    });

    // 캐시 무효화
    await cache.delete(`${CACHE_PREFIX.CAMPAIGN}*`);

    logger.info(`Campaign deleted: ${id}`);
  }

  /**
   * 캠페인 데이터 유효성 검사
   */
  private validateCampaignData(data: any) {
    const errors: Record<string, string> = {};

    if (!data.title || data.title.length < 5) {
      errors.title = "제목은 5자 이상이어야 합니다";
    }

    if (!data.description || data.description.length < 20) {
      errors.description = "설명은 20자 이상이어야 합니다";
    }

    if (!data.budget || data.budget <= 0) {
      errors.budget = "예산은 0보다 커야 합니다";
    }

    if (!data.category) {
      errors.category = "카테고리를 선택해주세요";
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("입력값이 올바르지 않습니다", errors);
    }
  }

  /**
   * 캠페인 통계 조회
   */
  async getCampaignStats(businessId: string) {
    const cacheKey = `${CACHE_PREFIX.STATS}campaign:${businessId}`;

    // 캐시 확인
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [total, active, completed, totalApplications] = await Promise.all([
      prisma.campaign.count({ where: { businessId } }),
      prisma.campaign.count({ where: { businessId, status: "active" } }),
      prisma.campaign.count({ where: { businessId, status: "completed" } }),
      prisma.campaignApplication.count({
        where: {
          campaign: { businessId },
        },
      }),
    ]);

    const stats = {
      total,
      active,
      completed,
      totalApplications,
      conversionRate:
        total > 0 ? ((totalApplications / total) * 100).toFixed(2) : 0,
    };

    // 캐시 저장
    await cache.set(cacheKey, stats, CACHE_TTL.MEDIUM);

    return stats;
  }
}

// 싱글톤 인스턴스 export
export const campaignService = CampaignService.getInstance();
