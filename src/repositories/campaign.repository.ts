/**
 * Campaign Repository
 * 데이터 접근 계층 - 세계 1% 수준의 Repository 패턴 구현
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import {
  CampaignFilters,
  PaginationParams,
  SortParams,
  CampaignQueryParams,
  CreateCampaignDTO,
  UpdateCampaignDTO,
  CampaignResponse,
  CampaignNotFoundError,
  PrismaQueryOptions,
  SortOption,
  CampaignStatus,
  Platform
} from '@/types/campaign.types';
import { QueryPerformance } from '@/lib/utils/performance';
import { logger } from '@/lib/utils/logger';

export class CampaignRepository {
  private static instance: CampaignRepository;

  private constructor() {}

  public static getInstance(): CampaignRepository {
    if (!CampaignRepository.instance) {
      CampaignRepository.instance = new CampaignRepository();
    }
    return CampaignRepository.instance;
  }

  /**
   * 캠페인 목록 조회 (최적화된 쿼리)
   */
  async findMany(params: CampaignQueryParams): Promise<{
    data: any[];
    total: number;
  }> {
    const { filters, pagination, sort, includeRelations } = params;
    
    const queryOptions = this.buildQueryOptions(filters, pagination, sort, includeRelations);
    
    // 병렬 쿼리 실행으로 성능 최적화
    const [data, total] = await Promise.all([
      QueryPerformance.measure(
        'campaign.repository.findMany',
        () => prisma.campaign.findMany(queryOptions),
        { filters, pagination }
      ),
      QueryPerformance.measure(
        'campaign.repository.count',
        () => prisma.campaign.count({ where: queryOptions.where }),
        { filters }
      )
    ]);

    return { data, total };
  }

  /**
   * 단일 캠페인 조회
   */
  async findById(id: string, includeRelations?: boolean): Promise<any> {
    const campaign = await QueryPerformance.measure(
      'campaign.repository.findById',
      () => prisma.campaign.findUnique({
        where: { id },
        include: includeRelations ? this.getDefaultIncludes() : undefined
      }),
      { id }
    );

    if (!campaign) {
      throw new CampaignNotFoundError(id);
    }

    return campaign;
  }

  /**
   * 캠페인 생성
   */
  async create(data: CreateCampaignDTO, businessId: string): Promise<any> {
    return await QueryPerformance.measure(
      'campaign.repository.create',
      () => prisma.$transaction(async (tx) => {
        // 1. 캠페인 생성
        const campaign = await tx.campaign.create({
          data: {
            businessId,
            title: data.title,
            description: data.description,
            platform: data.platform,
            budget: data.budget.amount,
            targetFollowers: data.targetFollowers,
            startDate: data.startDate,
            endDate: data.endDate,
            requirements: data.requirements,
            maxApplicants: data.maxApplicants,
            rewardAmount: data.rewardAmount.amount,
            location: data.location || '전국',
            status: CampaignStatus.DRAFT,
            isPaid: false
          }
        });

        // 2. 카테고리 연결
        if (data.categoryIds && data.categoryIds.length > 0) {
          await tx.campaignCategory.createMany({
            data: data.categoryIds.map((categoryId, index) => ({
              campaignId: campaign.id,
              categoryId,
              isPrimary: index === 0
            }))
          });
        }

        // 3. 해시태그 생성
        if (data.hashtags && data.hashtags.length > 0) {
          await tx.campaignHashtag.createMany({
            data: data.hashtags.map((hashtag, index) => ({
              campaignId: campaign.id,
              hashtag,
              order: index
            }))
          });
        }

        // 4. 이미지 생성
        if (data.images && data.images.length > 0) {
          await tx.campaignImage.createMany({
            data: data.images.map((image, index) => ({
              campaignId: campaign.id,
              imageUrl: image.url,
              type: image.type,
              alt: image.alt,
              caption: image.caption,
              order: image.order || index
            }))
          });
        }

        // 5. 완성된 캠페인 반환
        return await tx.campaign.findUnique({
          where: { id: campaign.id },
          include: this.getDefaultIncludes()
        });
      }),
      { businessId }
    );
  }

  /**
   * 캠페인 업데이트
   */
  async update(id: string, data: Partial<UpdateCampaignDTO>): Promise<any> {
    return await QueryPerformance.measure(
      'campaign.repository.update',
      () => prisma.$transaction(async (tx) => {
        // 캠페인 존재 확인
        const existing = await tx.campaign.findUnique({ where: { id } });
        if (!existing) {
          throw new CampaignNotFoundError(id);
        }

        // 기본 정보 업데이트
        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.platform) updateData.platform = data.platform;
        if (data.budget) updateData.budget = data.budget.amount;
        if (data.targetFollowers) updateData.targetFollowers = data.targetFollowers;
        if (data.startDate) updateData.startDate = data.startDate;
        if (data.endDate) updateData.endDate = data.endDate;
        if (data.requirements) updateData.requirements = data.requirements;
        if (data.maxApplicants) updateData.maxApplicants = data.maxApplicants;
        if (data.rewardAmount) updateData.rewardAmount = data.rewardAmount.amount;
        if (data.location) updateData.location = data.location;

        const campaign = await tx.campaign.update({
          where: { id },
          data: updateData
        });

        // 카테고리 업데이트
        if (data.categoryIds) {
          await tx.campaignCategory.deleteMany({ where: { campaignId: id } });
          await tx.campaignCategory.createMany({
            data: data.categoryIds.map((categoryId, index) => ({
              campaignId: id,
              categoryId,
              isPrimary: index === 0
            }))
          });
        }

        // 해시태그 업데이트
        if (data.hashtags) {
          await tx.campaignHashtag.deleteMany({ where: { campaignId: id } });
          await tx.campaignHashtag.createMany({
            data: data.hashtags.map((hashtag, index) => ({
              campaignId: id,
              hashtag,
              order: index
            }))
          });
        }

        return await tx.campaign.findUnique({
          where: { id },
          include: this.getDefaultIncludes()
        });
      }),
      { id }
    );
  }

  /**
   * 캠페인 삭제 (논리적 삭제)
   */
  async delete(id: string): Promise<void> {
    await QueryPerformance.measure(
      'campaign.repository.delete',
      () => prisma.campaign.update({
        where: { id },
        data: { deletedAt: new Date() }
      }),
      { id }
    );
  }

  /**
   * 카테고리별 통계 조회 (최적화된 집계 쿼리)
   */
  async getCategoryStats(): Promise<Record<string, number>> {
    const stats = await QueryPerformance.measure(
      'campaign.repository.categoryStats',
      () => prisma.$queryRaw<Array<{
        categoryId: string;
        slug: string;
        count: bigint;
      }>>`
        SELECT 
          c.id as "categoryId",
          c.slug,
          COUNT(DISTINCT cc."campaignId")::bigint as count
        FROM categories c
        LEFT JOIN campaign_categories cc ON c.id = cc."categoryId"
        LEFT JOIN campaigns camp ON cc."campaignId" = camp.id
        WHERE camp.status = ${CampaignStatus.ACTIVE}
          AND camp."deletedAt" IS NULL
        GROUP BY c.id, c.slug
        HAVING COUNT(cc."campaignId") > 0
        ORDER BY count DESC
      `,
      {}
    );

    const result: Record<string, number> = {};
    stats.forEach(stat => {
      result[stat.slug] = Number(stat.count);
    });

    return result;
  }

  /**
   * 인기 캠페인 조회
   */
  async findTrending(limit: number = 10): Promise<any[]> {
    return await QueryPerformance.measure(
      'campaign.repository.findTrending',
      () => prisma.$queryRaw`
        SELECT 
          c.*,
          COUNT(DISTINCT ca.id) as application_count,
          COUNT(DISTINCT cl.id) as like_count,
          (c."viewCount" * 0.3 + 
           COUNT(DISTINCT ca.id) * 10 + 
           COUNT(DISTINCT cl.id) * 5) as popularity_score
        FROM campaigns c
        LEFT JOIN campaign_applications ca ON c.id = ca."campaignId"
        LEFT JOIN campaign_likes cl ON c.id = cl."campaignId"
        WHERE c.status = ${CampaignStatus.ACTIVE}
          AND c."deletedAt" IS NULL
          AND c."endDate" > NOW()
        GROUP BY c.id
        ORDER BY popularity_score DESC
        LIMIT ${limit}
      `,
      { limit }
    );
  }

  /**
   * 쿼리 옵션 빌더
   */
  private buildQueryOptions(
    filters: CampaignFilters,
    pagination: PaginationParams,
    sort?: SortParams,
    includeRelations?: any
  ): PrismaQueryOptions {
    const where: Prisma.CampaignWhereInput = {
      deletedAt: null
    };

    // 필터 적용
    if (filters.status) where.status = filters.status;
    if (filters.businessId) where.businessId = filters.businessId;
    if (filters.platform) where.platform = filters.platform;
    
    if (filters.category) {
      where.categories = {
        some: {
          category: {
            slug: filters.category
          }
        }
      };
    }

    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) where.startDate.gte = filters.startDate;
      if (filters.endDate) where.startDate.lte = filters.endDate;
    }

    if (filters.minBudget || filters.maxBudget) {
      where.budget = {};
      if (filters.minBudget) where.budget.gte = filters.minBudget;
      if (filters.maxBudget) where.budget.lte = filters.maxBudget;
    }

    if (filters.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: 'insensitive' } },
        { description: { contains: filters.keyword, mode: 'insensitive' } }
      ];
    }

    // 정렬 옵션
    let orderBy: Prisma.CampaignOrderByWithRelationInput[] = [];
    if (sort) {
      switch (sort.field) {
        case SortOption.LATEST:
          orderBy = [{ createdAt: sort.order }];
          break;
        case SortOption.DEADLINE:
          orderBy = [{ endDate: sort.order }];
          break;
        case SortOption.BUDGET:
          orderBy = [{ budget: sort.order }];
          break;
        case SortOption.TRENDING:
          orderBy = [{ viewCount: sort.order }];
          break;
        default:
          orderBy = [{ createdAt: 'desc' }];
      }
    } else {
      orderBy = [{ createdAt: 'desc' }];
    }

    return {
      where,
      orderBy,
      skip: pagination.offset || (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      include: includeRelations || this.getDefaultIncludes()
    };
  }

  /**
   * 기본 include 옵션
   */
  private getDefaultIncludes(): Prisma.CampaignInclude {
    return {
      business: {
        select: {
          id: true,
          name: true,
          businessProfile: {
            select: {
              companyName: true,
              businessCategory: true
            }
          }
        }
      },
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          isPrimary: true
        }
      },
      _count: {
        select: {
          applications: true,
          campaignLikes: true
        }
      }
    };
  }
}

// Singleton export
export const campaignRepository = CampaignRepository.getInstance();