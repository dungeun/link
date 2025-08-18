import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { createErrorResponse, createSuccessResponse, createApiError, handleApiError } from '@/lib/utils/api-error';

// POST /api/business/campaigns - 새 캠페인 생성
export async function POST(request: NextRequest) {
  let user: { id: string; email: string; type: string } | null = null;
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
      budget,  // budget 필드 추가
      budgetType,  // budgetType 필드 추가
      categoryId,  // 카테고리 ID 추가
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
      questions,
      // 새로운 필드들
      applicationStartDate,
      applicationEndDate,
      contentStartDate,
      contentEndDate,
      resultAnnouncementDate,
      provisionDetails,
      campaignMission,
      keywords,
      additionalNotes
    } = body;

    // 유효성 검사 - 누락된 필드 구체적으로 알려주기
    const missingFields: string[] = [];
    
    if (!title) missingFields.push('제목(title)');
    if (!description) missingFields.push('설명(description)');
    if (!categoryId) missingFields.push('카테고리(categoryId)');
    if (!platform && (!platforms || platforms.length === 0)) missingFields.push('플랫폼(platform)');
    // budget, targetFollowers, maxApplicants, rewardAmount는 모두 선택적으로 처리
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
        budget: budget !== undefined ? budget : 0,  // budget 필드 추가
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
        detailImages: detailImages ? JSON.stringify(detailImages) : undefined,
        productImages: productImages ? JSON.stringify(productImages) : undefined,
        questions: questions ? questions : undefined,  // JSON 타입이므로 직접 저장
        // 새로운 필드들
        applicationStartDate: applicationStartDate ? new Date(applicationStartDate) : null,
        applicationEndDate: applicationEndDate ? new Date(applicationEndDate) : null,
        contentStartDate: contentStartDate ? new Date(contentStartDate) : null,
        contentEndDate: contentEndDate ? new Date(contentEndDate) : null,
        resultAnnouncementDate: resultAnnouncementDate ? new Date(resultAnnouncementDate) : null,
        provisionDetails: provisionDetails || null,
        campaignMission: campaignMission || null,
        keywords: keywords || null,
        additionalNotes: additionalNotes || null,
        status: 'DRAFT', // 결제 전에는 DRAFT 상태
        isPaid: false,
        businessId: user.id,
        // 카테고리 연결 (다대다 관계)
        categories: categoryId ? {
          create: {
            categoryId: categoryId,
            isPrimary: true
          }
        } : undefined
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
  let user: { id: string; email: string; type: string } | null = null;
  try {
    const authResult = await withAuth(request, ['BUSINESS', 'ADMIN']);
    if ('error' in authResult) {
      return authResult.error;
    }
    user = authResult.user;

    console.log('=== GET /api/business/campaigns ===');
    console.log('User ID:', user.id);
    console.log('User Type:', user.type);
    console.log('User Email:', user.email);

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

    console.log('Found campaigns:', campaigns.length);
    campaigns.forEach(c => {
      console.log(`- ${c.title} (Business: ${c.businessId})`);
    });

    // 캠페인 데이터 형식 변환
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      platform: campaign.platform,
      platforms: campaign.platforms ? JSON.parse(campaign.platforms as string) : [campaign.platform],
      budget: campaign.budget || 0, // budget 필드 추가
      maxApplications: campaign.maxApplicants,
      rewardAmount: campaign.rewardAmount,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      deadline: campaign.endDate, // 프론트엔드 호환성
      status: campaign.status,
      isPaid: campaign.isPaid,
      applications: campaign._count.applications,
      viewCount: 0, // 조회수는 추후 구현
      category: 'business', // 기본 카테고리
      imageUrl: campaign.thumbnailImageUrl || campaign.imageUrl,
      createdAt: campaign.createdAt
    }));

    return createSuccessResponse({ campaigns: formattedCampaigns });
  } catch (error) {
    return handleApiError(error, { userId: user?.id });
  }
}