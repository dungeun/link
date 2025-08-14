import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuth, createAuthResponse, createErrorResponse } from '@/lib/auth-middleware';
import { paginationSchema, campaignCreateSchema, ValidationHelper } from '@/lib/utils/validation';
import { z } from 'zod';
import { createSuccessResponse, handleApiError } from '@/lib/utils/api-error';
import { ResponseCache, CacheKeyBuilder, CachePresets } from '@/lib/utils/cache';
import { PerformanceTimer, QueryPerformance } from '@/lib/utils/performance';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/campaigns - 캠페인 목록 조회
export async function GET(request: NextRequest) {
  const timer = new PerformanceTimer('api.campaigns.GET');
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate pagination params using new validation utilities
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
    
    const { page, limit } = paginationResult.data;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const sort = searchParams.get('sort');
    const ranking = searchParams.get('ranking') === 'true';
    const recommended = searchParams.get('recommended') === 'true';
    const type = searchParams.get('type'); // recommended, trending, latest
    const offset = (page - 1) * limit;

    // 캐시 키 생성
    const cacheKey = CacheKeyBuilder.create()
      .add('campaigns')
      .page(page, limit)
      .filter({ status, category, platform, sort, ranking, recommended, type })
      .build();

    // 캐시된 응답 확인 또는 데이터 조회 (임시로 캐시 비활성화)
    const cachedData = await (async () => {
        try {
        // 필터 조건 구성
        const where: any = {};
        
        // 삭제된 캠페인 제외 (deletedAt이 null인 것만)
        where.deletedAt = null;
        
        // 기본적으로 ACTIVE 상태인 캠페인만 표시 (관리자가 승인한 캠페인)
        if (status) {
          where.status = status.toUpperCase();
        } else {
          // status 파라미터가 없으면 ACTIVE 캠페인만 표시
          where.status = 'ACTIVE';
        }
        
        if (category && category !== 'all') {
          where.categories = {
            some: {
              category: {
                slug: category
              }
            }
          };
        }
        // Note: When no category filter is applied, we include all campaigns (with and without categories)
        
        if (platform && platform !== 'all') {
          where.platform = platform.toUpperCase();
        }

        // 정렬 옵션 구성
        let orderBy: any[] = [
          { status: 'desc' }, // ACTIVE 캠페인을 먼저
          { createdAt: 'desc' }
        ];

        // 랭킹이나 추천인 경우 정렬 옵션 변경
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

        // 추천 타입별 정렬
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
              // 개인화 추천 로직 (현재는 신청자 수와 생성일 조합)
              orderBy = [
                { status: 'desc' },
                { applications: { _count: 'desc' } },
                { rewardAmount: 'desc' }
              ];
              break;
          }
        }

        // DB에서 캠페인 데이터 조회 (성능 측정 포함)
        let campaigns: any[] = [];
        let total: number = 0;
        
        try {
          const queryResults = await Promise.all([
            QueryPerformance.measure(
              'campaign.findMany',
              async () => {
                try {
                  // 먼저 캠페인 데이터만 조회
                  const campaignData = await prisma.campaign.findMany({
                    where,
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
                          applications: true
                        }
                      }
                    },
                    orderBy,
                    skip: offset,
                    take: limit
                  });
                  
                  // 데이터 검증
                  if (!Array.isArray(campaignData)) {
                    console.warn('Campaign data is not an array:', typeof campaignData);
                    return [];
                  }
                  
                  // business 정보를 별도로 조회
                  const businessIds = campaignData.map(c => c?.businessId).filter(Boolean);
                  let businesses = [];
                  
                  if (businessIds.length > 0) {
                    businesses = await prisma.user.findMany({
                      where: { 
                        id: { in: businessIds },
                        type: 'BUSINESS'
                      },
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
                    });
                  }
                  
                  // businesses 배열 검증
                  if (!Array.isArray(businesses)) {
                    businesses = [];
                  }
                  
                  // 캠페인과 business 정보 결합
                  return campaignData.map(campaign => ({
                    ...campaign,
                    business: businesses.find(b => b && b.id === campaign.businessId) || {
                      id: campaign.businessId,
                      name: 'Unknown',
                      businessProfile: null
                    }
                  }));
                } catch (innerError) {
                  console.error('Inner campaign query error:', innerError);
                  return [];
                }
              },
              { filters: { status, category, platform, sort, ranking, recommended, type }, pagination: { page, limit } }
            ),
            QueryPerformance.measure(
              'campaign.count',
              async () => {
                try {
                  return await prisma.campaign.count({ where });
                } catch (countError) {
                  console.error('Campaign count error:', countError);
                  return 0;
                }
              },
              { filters: { status, category, platform } }
            )
          ]);
          
          // 결과 할당 및 검증
          campaigns = Array.isArray(queryResults[0]) ? queryResults[0] : [];
          total = typeof queryResults[1] === 'number' ? queryResults[1] : 0;
          
        } catch (queryError) {
          console.error('Database query error:', queryError);
          campaigns = [];
          total = 0;
        }

        // 디버깅용 로그
        console.log('Campaigns type:', typeof campaigns, 'IsArray:', Array.isArray(campaigns));
        console.log('Campaigns length:', campaigns?.length);
        
        // 안전한 배열 확인 및 응답 데이터 포맷팅
        const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
        const formattedCampaigns = safeCampaigns.map((campaign, index) => {
          // 마감일까지 남은 일수 계산
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
            deadline: Math.max(0, daysDiff), // 마감일까지 남은 일수
            category: campaign.categories?.find(c => c.isPrimary)?.category?.slug || campaign.categories?.[0]?.category?.slug || 'other',
            categoryName: campaign.categories?.find(c => c.isPrimary)?.category?.name || campaign.categories?.[0]?.category?.name || 'Other',
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
            tags: (() => {
              if (!campaign.hashtags) return [];
              try {
                if (typeof campaign.hashtags === 'string' && campaign.hashtags.startsWith('[')) {
                  return JSON.parse(campaign.hashtags);
                } else if (typeof campaign.hashtags === 'string') {
                  return campaign.hashtags.split(' ').filter(tag => tag && tag.startsWith('#'));
                }
                return [];
              } catch (e) {
                console.warn('Failed to parse hashtags:', campaign.hashtags);
                if (typeof campaign.hashtags === 'string') {
                  return campaign.hashtags.split(' ').filter(tag => tag && tag.startsWith('#'));
                }
                return [];
              }
            })(),
            status: campaign.status?.toLowerCase() || 'unknown',
            created_at: campaign.createdAt?.toISOString() || new Date().toISOString(),
            createdAt: campaign.createdAt?.toISOString() || new Date().toISOString(),
            start_date: campaign.startDate,
            end_date: campaign.endDate,
            requirements: campaign.requirements || '',
            application_deadline: campaign.endDate, // 실제 지원 마감일이 있다면 해당 필드 사용
            // 랭킹 정보 추가 (랭킹 요청인 경우)
            ...(ranking && { rank: index + 1 })
          };
        });
        
        // 카테고리별 통계를 위한 별도 쿼리 (성능 측정 포함)
        let categoryStats: Record<string, number> = {};
        try {
          const campaignsByCategory = await QueryPerformance.measure(
            'category.groupBy',
            async () => {
              const stats = await prisma.campaignCategory.groupBy({
                by: ['categoryId'],
                _count: {
                  campaignId: true
                },
                where: {
                  campaign: {
                    status: 'ACTIVE'
                  }
                }
              });
              
              // 카테고리 정보 조회
              const categoryIds = stats.map(s => s.categoryId);
              const categories = await prisma.category.findMany({
                where: {
                  id: { in: categoryIds }
                },
                select: {
                  id: true,
                  slug: true,
                  name: true
                }
              });
              
              return stats.map(stat => ({
                ...stat,
                category: categories.find(c => c.id === stat.categoryId)
              }));
            },
            { purpose: 'category_stats' }
          );
          
          if (campaignsByCategory && Array.isArray(campaignsByCategory)) {
            campaignsByCategory.forEach(stat => {
              const categorySlug = stat.category?.slug || 'other';
              categoryStats[categorySlug] = stat._count.campaignId;
            });
          }
        } catch (statsError) {
          console.warn('Failed to fetch category stats:', statsError);
          categoryStats = {};
        }

        return {
          campaigns: formattedCampaigns,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          categoryStats
        };
        } catch (innerError) {
          console.error('Cache function error:', innerError);
          // 에러 발생 시 빈 데이터 반환
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

    const response = NextResponse.json(cachedData);
    
    // 성능 최적화를 위한 캐시 헤더 추가 (임시 비활성화)
    // ResponseCache.addCacheHeaders(response, CachePresets.CAMPAIGN_LIST.ttl, CachePresets.CAMPAIGN_LIST.swr);
    
    // 성능 측정 종료
    timer.end();
    
    return response;
  } catch (error: any) {
    console.error('Campaigns API Error Details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return handleApiError(error, { endpoint: 'campaigns', method: 'GET' });
  }
}

// POST /api/campaigns - 새 캠페인 생성
export async function POST(request: NextRequest) {
  const timer = new PerformanceTimer('api.campaigns.POST');
  let user: any = null;
  
  try {
    // Authenticate user
    const authResult = await requireAuth(request, ['BUSINESS']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    user = authResult;

    const body = await request.json();
    
    // Map the incoming data to our schema
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
    
    // Validate the data using new validation utilities
    const validationResult = await ValidationHelper.validate(campaignData, campaignCreateSchema);
    
    if (!validationResult.success) {
      const errors = ValidationHelper.formatErrorMessages(validationResult.errors!);
      return createErrorResponse('Invalid campaign data', 400, errors);
    }
    
    const validatedData = validationResult.data;

    // Create campaign with validated data (성능 측정 포함)
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

    // 캠페인 관련 캐시 무효화
    ResponseCache.invalidateCampaigns();
    ResponseCache.invalidateUser(user.id);

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