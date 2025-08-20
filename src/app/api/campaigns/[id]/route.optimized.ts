/**
 * 캠페인 상세 API - 완전 리팩토링된 버전
 * IntegratedQueryService, ApiResponseService 사용
 */

import { NextRequest } from 'next/server';
import { IntegratedQueryService } from '@/lib/services/integrated-query.service';
import { ApiResponseService } from '@/lib/services/api-response.service';
import { CampaignNormalizedService } from '@/lib/services/campaign-normalized.service';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

// 인증 미들웨어 (optional)
async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || '';
  
  if (!token) {
    return null;
  }

  try {
    const user = await verifyJWT(token);
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/campaigns/[id] - 캠페인 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    
    // ID 유효성 검증
    if (!campaignId || typeof campaignId !== 'string') {
      const errorResponse = ApiResponseService.badRequest('Invalid campaign ID');
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 사용자 인증 (선택적)
    const user = await authenticate(request);
    
    // 통합 쿼리 서비스로 캠페인 상세 조회
    const response = await IntegratedQueryService.getCampaignDetail(campaignId);

    if (!response.success) {
      return new Response(JSON.stringify(response), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 사용자별 추가 정보 조회 (인증된 경우)
    if (user && response.data) {
      try {
        // 사용자의 지원 상태, 좋아요 상태, 저장 상태 등을 병렬로 조회
        const [applicationStatus, likeStatus, saveStatus] = await Promise.all([
          // 지원 상태 확인
          user.type === 'INFLUENCER' ? prisma.campaignApplication.findFirst({
            where: {
              campaignId,
              influencerId: user.id,
              deletedAt: null
            },
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }) : null,
          
          // 좋아요 상태 확인
          prisma.campaignLike.findFirst({
            where: {
              campaignId,
              userId: user.id
            }
          }),
          
          // 저장 상태 확인
          prisma.savedCampaign.findFirst({
            where: {
              campaignId,
              userId: user.id
            }
          })
        ]);

        // 사용자별 상호작용 정보 추가
        response.data.userInteraction = {
          hasApplied: !!applicationStatus,
          applicationStatus: applicationStatus?.status,
          applicationDate: applicationStatus?.createdAt,
          hasLiked: !!likeStatus,
          hasSaved: !!saveStatus,
          canApply: user.type === 'INFLUENCER' && 
                   response.data.status === 'ACTIVE' && 
                   !applicationStatus &&
                   response.data.stats.applicationCount < response.data.maxApplicants
        };
      } catch (userInfoError) {
        console.warn('Failed to fetch user interaction data:', userInfoError);
        // 사용자 정보 조회 실패는 무시하고 기본 캠페인 정보만 반환
      }
    }

    // 기존 API 호환성을 위한 응답 변환
    const legacyFormatted = {
      id: response.data.id,
      title: response.data.title,
      description: response.data.description,
      platform: response.data.platform,
      budget: response.data.budget,
      targetFollowers: response.data.targetFollowers,
      startDate: response.data.startDate,
      endDate: response.data.endDate,
      applicationEndDate: response.data.applicationEndDate,
      requirements: response.data.requirements,
      hashtags: response.data.hashtags,
      imageUrl: response.data.images.find((img: any) => img.type === 'MAIN')?.url,
      headerImageUrl: response.data.images.find((img: any) => img.type === 'HEADER')?.url,
      thumbnailImageUrl: response.data.images.find((img: any) => img.type === 'THUMBNAIL')?.url,
      detailImages: response.data.images.filter((img: any) => img.type === 'DETAIL'),
      productImages: response.data.images.filter((img: any) => img.type === 'PRODUCT'),
      status: response.data.status,
      maxApplicants: response.data.maxApplicants,
      rewardAmount: response.data.rewardAmount,
      location: response.data.location || '전국',
      viewCount: response.data.stats.viewCount,
      
      // 비즈니스 정보
      business: response.data.business,
      
      // 카테고리 정보
      categories: response.data.categories,
      
      // 통계 정보
      applicationCount: response.data.stats.applicationCount,
      approvedCount: response.data.stats.approvedCount,
      
      // 계산된 필드
      computedStatus: response.data.computedStatus,
      daysRemaining: response.data.daysRemaining,
      effectiveBudget: response.data.effectiveBudget,
      
      // 사용자 상호작용 (있는 경우)
      ...(response.data.userInteraction && { userInteraction: response.data.userInteraction }),
      
      // 메타데이터
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };

    return new Response(JSON.stringify(legacyFormatted), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        // 캐시 헤더 추가
        'Cache-Control': response.meta?.cache?.cached 
          ? `public, max-age=${response.meta.cache.ttl}` 
          : 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('Campaign detail API error:', error);
    const errorResponse = ApiResponseService.internalError();
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * PUT /api/campaigns/[id] - 캠페인 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    
    // 사용자 인증 필수
    const user = await authenticate(request);
    if (!user) {
      const errorResponse = ApiResponseService.unauthorized();
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 캠페인 소유자 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { businessId: true, status: true }
    });

    if (!campaign) {
      const errorResponse = ApiResponseService.notFound('Campaign');
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (campaign.businessId !== user.id && user.type !== 'ADMIN') {
      const errorResponse = ApiResponseService.forbidden();
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 요청 본문 파싱
    const body = await request.json();
    
    // 기본 캠페인 정보 업데이트
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.budget !== undefined && { budget: body.budget }),
        ...(body.rewardAmount !== undefined && { rewardAmount: body.rewardAmount }),
        ...(body.maxApplicants && { maxApplicants: body.maxApplicants }),
        ...(body.requirements && { requirements: body.requirements }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
        ...(body.applicationEndDate && { applicationEndDate: new Date(body.applicationEndDate) }),
        updatedAt: new Date()
      }
    });

    // 정규화된 데이터 업데이트
    if (body.hashtags) {
      await CampaignNormalizedService.updateCampaignHashtags(campaignId, body.hashtags);
    }

    if (body.platforms) {
      await CampaignNormalizedService.updateCampaignPlatforms(campaignId, body.platforms);
    }

    if (body.images) {
      await CampaignNormalizedService.updateCampaignImages(campaignId, body.images);
    }

    if (body.keywords) {
      await CampaignNormalizedService.updateCampaignKeywords(campaignId, body.keywords);
    }

    if (body.questions) {
      await CampaignNormalizedService.updateCampaignQuestions(campaignId, body.questions);
    }

    // 캐시 무효화
    await IntegratedQueryService.invalidateCache('campaign', campaignId);

    const response = ApiResponseService.success(updatedCampaign);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Campaign update error:', error);
    const errorResponse = ApiResponseService.internalError();
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * DELETE /api/campaigns/[id] - 캠페인 삭제 (소프트 삭제)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    
    // 사용자 인증 필수
    const user = await authenticate(request);
    if (!user) {
      const errorResponse = ApiResponseService.unauthorized();
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 캠페인 소유자 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { businessId: true, status: true }
    });

    if (!campaign) {
      const errorResponse = ApiResponseService.notFound('Campaign');
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (campaign.businessId !== user.id && user.type !== 'ADMIN') {
      const errorResponse = ApiResponseService.forbidden();
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 소프트 삭제
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        deletedAt: new Date(),
        status: 'DELETED'
      }
    });

    // 캐시 무효화
    await IntegratedQueryService.invalidateCache('campaign', campaignId);

    const response = ApiResponseService.success(null);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Campaign delete error:', error);
    const errorResponse = ApiResponseService.internalError();
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}