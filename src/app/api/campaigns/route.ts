import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, createAuthResponse, createErrorResponse } from '@/lib/auth-middleware';
import { paginationSchema, campaignCreateSchema, ValidationHelper } from '@/lib/utils/validation';
import { z } from 'zod';
import { createSuccessResponse, handleApiError } from '@/lib/utils/api-error';
import { ResponseCache, CacheKeyBuilder, CachePresets } from '@/lib/utils/cache';
import { CampaignCache, CategoryStatsCache } from '@/lib/utils/redis-cache';
import { PerformanceTimer, QueryPerformance } from '@/lib/utils/performance';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
async function getOptimizedCampaigns(filters: any, pagination: any, orderBy: any) {
  const timer = new PerformanceTimer('campaigns.optimized_query');
  
  try {
    // 1. 메인 캠페인 데이터 + 비즈니스 정보를 JOIN으로 한 번에 조회
    const campaigns = await QueryPerformance.measure(
      'campaign.findManyWithBusiness',
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
                    slug: true
                  }
                },
                isPrimary: true
              }
            },
            _count: {
              select: {
                applications: {
                  where: {
                    deletedAt: null
                  }
                }
              }
            },
            // 비즈니스 정보 JOIN
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
            }
          },
          orderBy,
          skip: pagination.offset,
          take: pagination.limit
        });
      },
      { filters, pagination }
    );

    // 2. 전체 개수 조회 (별도 쿼리이지만 인덱스 최적화됨)
    const total = await QueryPerformance.measure(
      'campaign.count',
      () => prisma.campaign.count({ where: filters }),
      { filters }
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
    'category.stats.optimized',
    async () => {
      // 단일 쿼리로 카테고리별 통계 조회 (인덱스 활용)
      const rawStats = await prisma.$queryRaw<Array<{
        categoryId: string;
        slug: string;
        name: string;
        campaignCount: bigint;
      }>>`
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
      rawStats.forEach(stat => {
        stats[stat.slug] = Number(stat.campaignCount);
      });
      
      return stats;
    },
    { purpose: 'category_stats_single_query' }
  );
}

// 응답 데이터 포맷팅 함수
function formatCampaignResponse(campaign: any, index?: number, isRanking?: boolean): any {
  const today = new Date();
  const endDate = new Date(campaign.endDate);
  const timeDiff = endDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return {
    id: campaign.id,
    title: campaign.title,
    brand: campaign.business?.businessProfile?.companyName || campaign.business?.name || 'Unknown',
    brand_name: campaign.business?.businessProfile?.companyName || campaign.business?.name || 'Unknown',
    description: campaign.description || '',
    budget: campaign.budget,
    deadline: Math.max(0, daysDiff),
    category: campaign.categories?.find((c: any) => c.isPrimary)?.category?.slug || campaign.categories?.[0]?.category?.slug || 'other',
    categoryName: campaign.categories?.find((c: any) => c.isPrimary)?.category?.name || campaign.categories?.[0]?.category?.name || 'Other',
    platforms: [campaign.platform?.toLowerCase() || 'unknown'],
    required_followers: campaign.targetFollowers,
    location: '전국',
    view_count: 0,
    applicants: campaign._count.applications,
    applicant_count: campaign._count.applications,
    maxApplicants: campaign.maxApplicants,
    rewardAmount: campaign.rewardAmount,
    imageUrl: campaign.thumbnailImageUrl || campaign.headerImageUrl || campaign.imageUrl || '/images/campaigns/default.jpg',
    image_url: campaign.thumbnailImageUrl || campaign.headerImageUrl || campaign.imageUrl || '/images/campaigns/default.jpg',
    tags: parseHashtags(campaign.hashtags),
    status: campaign.status?.toLowerCase() || 'unknown',
    created_at: campaign.createdAt?.toISOString() || new Date().toISOString(),
    createdAt: campaign.createdAt?.toISOString() || new Date().toISOString(),
    start_date: campaign.startDate,
    end_date: campaign.endDate,
    requirements: campaign.requirements || '',
    application_deadline: campaign.endDate,
    ...(isRanking && typeof index === 'number' && { rank: index + 1 })
  };
}

// 해시태그 파싱 최적화
function parseHashtags(hashtags: string | null): string[] {
  if (!hashtags) return [];
  
  try {
    if (typeof hashtags === 'string' && hashtags.startsWith('[')) {
      return JSON.parse(hashtags);
    } else if (typeof hashtags === 'string') {
      return hashtags.split(' ').filter(tag => tag && tag.startsWith('#'));
    }
    return [];
  } catch (e) {
    if (typeof hashtags === 'string') {
      return hashtags.split(' ').filter(tag => tag && tag.startsWith('#'));
    }
    return [];
  }
}

// GET /api/campaigns - 최적화된 캠페인 목록 조회
export async function GET(request: NextRequest) {
  const timer = new PerformanceTimer('api.campaigns.GET.optimized');
  
  try {
    const { searchParams } = new URL(request.url);
    
    // 파라미터 검증
    const paginationResult = await ValidationHelper.validate(
      {
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20'
      },
      paginationSchema
    );
    
    if (!paginationResult.success) {
      const errors = paginationResult.errors 
        ? ValidationHelper.formatErrorMessages(paginationResult.errors)
        : ['Invalid pagination parameters'];
      return createErrorResponse('Invalid pagination parameters', 400, errors);
    }
    
    const { page, limit } = paginationResult.data!;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const sort = searchParams.get('sort');
    const ranking = searchParams.get('ranking') === 'true';
    const recommended = searchParams.get('recommended') === 'true';
    const type = searchParams.get('type');
    const offset = (page - 1) * limit;

    // 캐시 키 생성
    const cacheKey = CacheKeyBuilder.create()
      .add('campaigns_v2')
      .page(page, limit)
      .filter({ status, category, platform, sort, ranking, recommended, type })
      .build();

    // 캐시 확인
    const cachedData = await CampaignCache.get({ status, category, platform, sort, ranking, recommended, type }, { page, limit });
    if (cachedData) {
      const response = NextResponse.json(cachedData);
      timer.end();
      return response;
    }

    // 캐시 미스 시 데이터 조회
    const responseData = await (async () => {
      // WHERE 조건 최적화
      const where: any = {
        deletedAt: null,
        status: status?.toUpperCase() || 'ACTIVE'
      };
      
      // 카테고리 필터링 최적화
      if (category && category !== 'all') {
        where.categories = {
          some: {
            category: {
              slug: category
            }
          }
        };
      }
      
      // 플랫폼 필터링
      if (platform && platform !== 'all') {
        where.platform = platform.toUpperCase();
      }

      // 정렬 옵션 최적화
      let orderBy: any[] = [
        { status: 'desc' },
        { createdAt: 'desc' }
      ];

      // 정렬 최적화 (인덱스 활용)
      if (ranking || recommended) {
        if (sort === 'applicants') {
          orderBy = [
            { status: 'desc' },
            { applications: { _count: 'desc' } }
          ];
        } else if (sort === 'deadline') {
          orderBy = [
            { status: 'desc' },
            { endDate: 'asc' }
          ];
        } else if (sort === 'budget') {
          orderBy = [
            { status: 'desc' },
            { budget: 'desc' }
          ];
        }
      }

      // 추천 타입별 정렬 최적화
      if (recommended && type) {
        switch (type) {
          case 'trending':
            orderBy = [
              { status: 'desc' },
              { applications: { _count: 'desc' } },
              { createdAt: 'desc' }
            ];
            break;
          case 'latest':
            orderBy = [
              { status: 'desc' },
              { createdAt: 'desc' }
            ];
            break;
          case 'recommended':
          default:
            orderBy = [
              { status: 'desc' },
              { applications: { _count: 'desc' } },
              { rewardAmount: 'desc' }
            ];
            break;
        }
      }

      try {
        // 최적화된 캠페인 데이터 조회
        const { campaigns, total } = await getOptimizedCampaigns(
          where,
          { offset, limit },
          orderBy
        );

        // 캠페인 데이터 포맷팅
        const formattedCampaigns = campaigns.map((campaign: any, index: number) => 
          formatCampaignResponse(campaign, index, ranking)
        );
        
        // 카테고리 통계 조회 (캐시 활용)
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
            totalPages: Math.ceil(total / limit)
          },
          categoryStats
        };

        // 결과를 캐시에 저장
        await CampaignCache.set({ status, category, platform, sort, ranking, recommended, type }, { page, limit }, result);
        
        return result;
      } catch (queryError) {
        console.error('Optimized query error:', queryError);
        return {
          campaigns: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          },
          categoryStats: {}
        };
      }
    })();

    const response = NextResponse.json(responseData);
    timer.end();
    
    return response;
  } catch (error) {
    console.error('Campaigns API Error Details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error
    });
    return handleApiError(error, { endpoint: 'campaigns', method: 'GET' });
  }
}

// POST 메소드는 기존과 동일
export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer('api.campaigns.POST');
  let user: any = null;
  
  try {
    const authResult = await requireAuth(request, ['BUSINESS']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    user = authResult;

    const body = await request.json();
    
    const campaignData = {
      title: body.title,
      description: body.description,
      platform: body.platform || 'INSTAGRAM',
      budget: body.budget,
      targetFollowers: body.min_followers || 1000,
      startDate: body.campaign_start_date || new Date().toISOString(),
      endDate: body.campaign_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: body.requirements,
      hashtags: body.hashtags,
      maxApplicants: body.max_applicants,
      rewardAmount: body.reward_amount || body.budget * 0.8,
      location: body.location || '전국'
    };
    
    const validationResult = await ValidationHelper.validate(campaignData, campaignCreateSchema);
    
    if (!validationResult.success) {
      const errors = ValidationHelper.formatErrorMessages(validationResult.errors!);
      return createErrorResponse('Invalid campaign data', 400, errors);
    }
    
    const validatedData = validationResult.data!;

    const campaign = await QueryPerformance.measure(
      'campaign.create',
      () => prisma.campaign.create({
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
          hashtags: validatedData.hashtags ? JSON.stringify(validatedData.hashtags) : null,
          maxApplicants: validatedData.maxApplicants,
          rewardAmount: validatedData.rewardAmount,
          location: validatedData.location,
          status: 'DRAFT',
          isPaid: false
        }
      }),
      { userId: user.id, platform: validatedData.platform }
    );

    // 캐시 무효화
    ResponseCache.invalidateCampaigns();
    ResponseCache.invalidateUser(user.id);
    await CampaignCache.invalidate();
    await CategoryStatsCache.invalidate();

    timer.end();

    return createSuccessResponse(
      campaign,
      '캠페인이 성공적으로 생성되었습니다.',
      201
    );
  } catch (error) {
    return handleApiError(error, { endpoint: 'campaigns', method: 'POST', userId: user?.id });
  }
}