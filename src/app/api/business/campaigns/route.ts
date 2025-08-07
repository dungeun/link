import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { createErrorResponse, createSuccessResponse, createApiError, handleApiError } from '@/lib/utils/api-error';

// POST /api/business/campaigns - 새 캠페인 생성
export async function POST(request: NextRequest) {
  let user: any = null;
  try {
    const authResult = await withAuth(request, ['BUSINESS', 'ADMIN']);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    const body = await request.json();
    const {
      title,
      description,
      platform,
      platforms,
      budget,
      targetFollowers,
      maxApplicants,
      rewardAmount,
      startDate,
      endDate,
      announcementDate,
      requirements,
      hashtags,
      imageUrl,
      headerImageUrl,
      thumbnailImageUrl,
      detailImages,
      productImages,
      youtubeUrl,
      questions
    } = body;

    // 유효성 검사 - 누락된 필드 구체적으로 알려주기
    const missingFields: string[] = [];
    
    if (!title) missingFields.push('제목(title)');
    if (!description) missingFields.push('설명(description)');
    if (!platform && (!platforms || platforms.length === 0)) missingFields.push('플랫폼(platform)');
    if (!budget) missingFields.push('예산(budget)');
    if (!targetFollowers) missingFields.push('목표 팔로워수(targetFollowers)');
    // maxApplicants와 rewardAmount는 선택적으로 처리
    if (!startDate) missingFields.push('시작일(startDate)');
    if (!endDate) missingFields.push('종료일(endDate)');
    
    if (missingFields.length > 0) {
      return createErrorResponse(
        createApiError.validation(
          `다음 필드를 입력해주세요: ${missingFields.join(', ')}`,
          { missingFields }
        )
      );
    }

    // 날짜 유효성 검사
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj < today) {
      return createErrorResponse(
        createApiError.validation('시작일은 오늘 날짜 이후여야 합니다.')
      );
    }

    if (endDateObj <= startDateObj) {
      return createErrorResponse(
        createApiError.validation('종료일은 시작일 이후여야 합니다.')
      );
    }

    // 캠페인 생성
    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        platform: platform || (platforms && platforms[0]) || 'INSTAGRAM',
        platforms: platforms ? JSON.stringify(platforms) : null,
        budget,
        targetFollowers,
        maxApplicants: maxApplicants || 100,
        rewardAmount: rewardAmount || 0,
        startDate: startDateObj,
        endDate: endDateObj,
        announcementDate: announcementDate ? new Date(announcementDate) : null,
        requirements: requirements || '',
        hashtags: hashtags ? JSON.stringify(hashtags) : '[]',
        imageUrl: thumbnailImageUrl || imageUrl || null,  // 썸네일 우선, 없으면 기존 필드
        headerImageUrl: headerImageUrl || null,
        thumbnailImageUrl: thumbnailImageUrl || null,
        detailImages: detailImages ? JSON.stringify(detailImages) : null,
        productImages: productImages ? JSON.stringify(productImages) : null,
        questions: questions ? questions : null,  // JSON 타입이므로 직접 저장
        status: 'DRAFT', // 결제 전에는 DRAFT 상태
        isPaid: false,
        businessId: user.id
      }
    });

    return createSuccessResponse(
      campaign,
      '캠페인이 성공적으로 생성되었습니다.',
      201
    );
  } catch (error) {
    return handleApiError(error, { userId: user?.id });
  }
}

// GET /api/business/campaigns - 비즈니스 계정의 캠페인 목록 조회
export async function GET(request: NextRequest) {
  let user: any = null;
  try {
    const authResult = await withAuth(request, ['BUSINESS', 'ADMIN']);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    // 비즈니스 계정의 캠페인 목록 조회
    const campaigns = await prisma.campaign.findMany({
      where: {
        businessId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    // 캠페인 데이터 형식 변환
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      description: (campaign as any).description,
      platform: (campaign as any).category,
      budget: campaign.budget,
      targetFollowers: (campaign as any).targetFollowers,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status.toLowerCase(),
      isPaid: campaign.isPaid,
      applications: campaign._count.applications,
      imageUrl: campaign.imageUrl,
      createdAt: campaign.createdAt
    }));

    return createSuccessResponse({ campaigns: formattedCampaigns });
  } catch (error) {
    return handleApiError(error, { userId: user?.id });
  }
}