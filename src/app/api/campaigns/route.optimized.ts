/**
 * 캠페인 API - 완전 리팩토링된 버전
 * IntegratedQueryService, ApiResponseService, 정규화된 데이터 사용
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { IntegratedQueryService } from '@/lib/services/integrated-query.service';
import { ApiResponseService, NextApiResponseHelper } from '@/lib/services/api-response.service';
import { CampaignNormalizedService } from '@/lib/services/campaign-normalized.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 쿼리 파라미터 스키마
const campaignListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  platform: z.string().optional(),
  businessId: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['created', 'budget', 'endDate', 'applications']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  hashtags: z.string().transform(val => val ? val.split(',') : undefined).optional(),
  minBudget: z.coerce.number().optional(),
  maxBudget: z.coerce.number().optional(),
  ranking: z.string().transform(val => val === 'true').default(false),
  recommended: z.string().transform(val => val === 'true').default(false),
  type: z.enum(['trending', 'latest', 'recommended']).optional()
});

// 캠페인 생성 스키마
const campaignCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  platform: z.string().default('INSTAGRAM'),
  budget: z.number().optional(),
  targetFollowers: z.number().min(0).default(1000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  applicationEndDate: z.string().datetime().optional(),
  requirements: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  platforms: z.array(z.object({
    platform: z.string(),
    isPrimary: z.boolean()
  })).optional(),
  images: z.array(z.object({
    url: z.string(),
    type: z.enum(['MAIN', 'HEADER', 'THUMBNAIL', 'DETAIL', 'PRODUCT']),
    order: z.number(),
    alt: z.string().optional(),
    caption: z.string().optional()
  })).optional(),
  keywords: z.array(z.object({
    keyword: z.string(),
    weight: z.number()
  })).optional(),
  questions: z.array(z.object({
    question: z.string(),
    type: z.enum(['TEXT', 'MULTIPLE_CHOICE', 'BOOLEAN', 'NUMBER']),
    required: z.boolean(),
    options: z.any().optional(),
    order: z.number()
  })).optional(),
  maxApplicants: z.number().min(1).default(100),
  rewardAmount: z.number().min(0).default(0),
  location: z.string().default('전국'),
  categoryIds: z.array(z.string()).optional()
});

/**
 * GET /api/campaigns - 캠페인 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 파라미터 검증 및 파싱
    const parseResult = campaignListSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      platform: searchParams.get('platform'),
      businessId: searchParams.get('businessId'),
      category: searchParams.get('category'),
      sortBy: searchParams.get('sortBy') || searchParams.get('sort'),
      sortOrder: searchParams.get('sortOrder'),
      search: searchParams.get('search'),
      hashtags: searchParams.get('hashtags'),
      minBudget: searchParams.get('minBudget'),
      maxBudget: searchParams.get('maxBudget'),
      ranking: searchParams.get('ranking'),
      recommended: searchParams.get('recommended'),
      type: searchParams.get('type')
    });

    if (!parseResult.success) {
      return NextApiResponseHelper.send(
        { status: (code: number) => ({ json: (data: any) => ({ status: code, json: data }) }) },
        ApiResponseService.validationError('query', parseResult.error.issues[0]?.message || 'Validation failed')
      );
    }

    const params = parseResult.data;

    // 특별한 정렬 방식 처리 (기존 호환성)
    if (params.ranking || params.recommended) {
      if (params.type === 'trending') {
        params.sortBy = 'applications';
      } else if (params.type === 'latest') {
        params.sortBy = 'created';
      }
    }

    // 통합 쿼리 서비스 사용
    const response = await IntegratedQueryService.getCampaignList(params);

    // 기존 API 호환성을 위한 응답 변환
    if (response.success && response.data) {
      const legacyFormatted = {
        campaigns: response.data.map((campaign: any, index: number) => ({
          id: campaign.id,
          title: campaign.title,
          brand: campaign.business.companyName || campaign.business.name,
          brand_name: campaign.business.companyName || campaign.business.name,
          description: campaign.description,
          budget: campaign.budget,
          deadline: campaign.daysRemaining || 0,
          category: campaign.categories[0]?.slug || 'other',
          categoryName: campaign.categories[0]?.name || 'Other',
          platforms: campaign.platforms.map((p: any) => p.platform.toLowerCase()),
          required_followers: campaign.targetFollowers,
          location: campaign.location || '전국',
          view_count: campaign.stats.viewCount,
          applicants: campaign.stats.applicationCount,
          applicant_count: campaign.stats.applicationCount,
          maxApplicants: campaign.maxApplicants,
          rewardAmount: campaign.rewardAmount,
          imageUrl: campaign.images.find((img: any) => img.type === 'THUMBNAIL')?.url || 
                   campaign.images.find((img: any) => img.type === 'HEADER')?.url ||
                   campaign.images.find((img: any) => img.type === 'MAIN')?.url ||
                   '/images/campaigns/default.jpg',
          image_url: campaign.images.find((img: any) => img.type === 'THUMBNAIL')?.url || 
                    campaign.images.find((img: any) => img.type === 'HEADER')?.url ||
                    campaign.images.find((img: any) => img.type === 'MAIN')?.url ||
                    '/images/campaigns/default.jpg',
          tags: campaign.hashtags,
          status: campaign.status.toLowerCase(),
          created_at: campaign.createdAt,
          createdAt: campaign.createdAt,
          start_date: campaign.startDate,
          end_date: campaign.endDate,
          requirements: campaign.requirements || '',
          application_deadline: campaign.applicationEndDate || campaign.endDate,
          ...(params.ranking && { rank: index + 1 })
        })),
        pagination: response.meta?.pagination,
        categoryStats: {} // 별도 구현 필요
      };

      return new Response(JSON.stringify(legacyFormatted), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Campaigns GET error:', error);
    const errorResponse = ApiResponseService.internalError();
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * POST /api/campaigns - 캠페인 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const authResult = await requireAuth(request, ['BUSINESS']);
    if (authResult instanceof Response) {
      return authResult;
    }
    const user = authResult;

    // 요청 본문 파싱
    const body = await request.json();
    
    // 데이터 검증
    const parseResult = campaignCreateSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify(
          ApiResponseService.validationError('body', parseResult.error.issues[0]?.message || 'Validation failed')
        ),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const data = parseResult.data;

    // 캠페인 생성
    const campaign = await prisma.campaign.create({
      data: {
        businessId: user.id,
        title: data.title,
        description: data.description,
        platform: data.platform,
        budget: data.budget,
        targetFollowers: data.targetFollowers,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        applicationEndDate: data.applicationEndDate ? new Date(data.applicationEndDate) : undefined,
        requirements: data.requirements,
        maxApplicants: data.maxApplicants,
        rewardAmount: data.rewardAmount,
        location: data.location,
        status: 'DRAFT'
      }
    });

    // 정규화된 데이터 저장
    if (data.hashtags) {
      await CampaignNormalizedService.updateCampaignHashtags(campaign.id, data.hashtags);
    }

    if (data.platforms) {
      await CampaignNormalizedService.updateCampaignPlatforms(campaign.id, data.platforms);
    }

    if (data.images) {
      await CampaignNormalizedService.updateCampaignImages(campaign.id, data.images);
    }

    if (data.keywords) {
      await CampaignNormalizedService.updateCampaignKeywords(campaign.id, data.keywords);
    }

    if (data.questions) {
      await CampaignNormalizedService.updateCampaignQuestions(campaign.id, data.questions);
    }

    // 카테고리 연결 (기존 방식 유지)
    if (data.categoryIds && data.categoryIds.length > 0) {
      await prisma.campaignCategory.createMany({
        data: data.categoryIds.map((categoryId, index) => ({
          campaignId: campaign.id,
          categoryId,
          isPrimary: index === 0
        }))
      });
    }

    // 캐시 무효화
    await IntegratedQueryService.invalidateCache('campaign');

    const response = ApiResponseService.success(campaign);
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Campaigns POST error:', error);
    const errorResponse = ApiResponseService.internalError();
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}