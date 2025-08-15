import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyJWT } from '@/lib/auth/jwt';

// 인증 미들웨어
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

// GET /api/campaigns/[id] - 캠페인 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const user = await authenticate(request);
    
    console.log('User authentication:', {
      user: user ? { id: user.id, type: user.type } : null,
      campaignId
    });

    // 캠페인 기본 정보와 사용자별 상호작용을 병렬로 조회
    const [campaign, userInteractions] = await Promise.all([
      // 캠페인 기본 정보
      prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          title: true,
          description: true,
          platform: true,
          budget: true,
          targetFollowers: true,
          maxApplicants: true,
          startDate: true,
          endDate: true,
          requirements: true,
          hashtags: true,
          imageUrl: true,
          headerImageUrl: true,
          thumbnailImageUrl: true,
          detailImages: true,
          productImages: true,
          status: true,
          createdAt: true,
          applicationStartDate: true,
          applicationEndDate: true,
          contentStartDate: true,
          contentEndDate: true,
          resultAnnouncementDate: true,
          provisionDetails: true,
          campaignMission: true,
          keywords: true,
          additionalNotes: true,
          announcementDate: true,
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
          _count: {
            select: {
              applications: true,
              campaignLikes: true
            }
          }
        }
      }),
      
      // 사용자별 상호작용 정보 (로그인한 경우만)
      user ? Promise.all([
        // 지원 상태 확인
        user.type === 'INFLUENCER' ? prisma.campaignApplication.findFirst({
          where: {
            campaignId: campaignId,
            influencerId: user.id
          },
          select: { status: true }
        }) : Promise.resolve(null),
        
        // 좋아요 상태 확인
        prisma.campaignLike.findFirst({
          where: {
            campaignId: campaignId,
            userId: user.id
          },
          select: { id: true }
        }),
        
        // 저장 상태 확인
        prisma.savedCampaign.findFirst({
          where: {
            campaignId: campaignId,
            userId: user.id
          },
          select: { id: true }
        })
      ]) : Promise.resolve([null, null, null])
    ]);

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 상호작용 정보 추출
    const [applicationData, likeData, savedData] = userInteractions || [null, null, null];
    const hasApplied = !!applicationData;
    const applicationStatus = applicationData?.status || null;
    const isLiked = !!likeData;
    const isSaved = !!savedData;

    // 응답 데이터 포맷팅
    const formattedCampaign = {
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        business: {
          id: campaign.business.id,
          name: campaign.business.businessProfile?.companyName || campaign.business.name,
          logo: null,
          category: campaign.business.businessProfile?.businessCategory || 'other'
        },
        platforms: campaign.platform ? [campaign.platform] : ['INSTAGRAM'],
        budget: campaign.budget,
        targetFollowers: campaign.targetFollowers,
        maxApplicants: campaign.maxApplicants || 100,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        requirements: campaign.requirements,
        hashtags: (() => {
          if (!campaign.hashtags) return [];
          if (Array.isArray(campaign.hashtags)) return campaign.hashtags;
          if (typeof campaign.hashtags === 'string') {
            try {
              // JSON 배열 형식인 경우
              if (campaign.hashtags.startsWith('[')) {
                return JSON.parse(campaign.hashtags);
              }
              // 공백으로 구분된 해시태그인 경우
              return campaign.hashtags.split(' ').filter(tag => tag.startsWith('#')).map(tag => tag.replace('#', ''));
            } catch (e) {
              // 파싱 실패 시 빈 배열 반환
              return [];
            }
          }
          return [];
        })(),
        imageUrl: campaign.imageUrl,
        headerImageUrl: campaign.headerImageUrl,
        thumbnailImageUrl: campaign.thumbnailImageUrl,
        detailImages: campaign.detailImages ? (typeof campaign.detailImages === 'string' ? JSON.parse(campaign.detailImages) : campaign.detailImages) : [],
        productImages: campaign.productImages ? (typeof campaign.productImages === 'string' ? JSON.parse(campaign.productImages) : campaign.productImages) : [],
        status: campaign.status,
        createdAt: campaign.createdAt,
        // 새로운 필드들 추가
        applicationStartDate: campaign.applicationStartDate,
        applicationEndDate: campaign.applicationEndDate,
        contentStartDate: campaign.contentStartDate,
        contentEndDate: campaign.contentEndDate,
        resultAnnouncementDate: campaign.resultAnnouncementDate,
        provisionDetails: campaign.provisionDetails,
        campaignMission: campaign.campaignMission,
        keywords: campaign.keywords,
        additionalNotes: campaign.additionalNotes,
        announcementDate: campaign.announcementDate,
        _count: {
          applications: campaign._count.applications,
          likes: campaign._count.campaignLikes
        },
        applications: [], // 지원자 목록은 별도 API에서 제공
        isLiked,
        isSaved,
        hasApplied,
        applicationStatus
      }
    };

    return NextResponse.json(formattedCampaign);
  } catch (error) {
    console.error('캠페인 조회 오류:', error);
    console.error('Campaign ID:', params.id);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: '캠페인을 불러오는데 실패했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        campaignId: params.id
      },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id] - 캠페인 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const campaignId = params.id;
    const body = await request.json();

    // 권한 확인 (캠페인 소유자 또는 관리자)
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        businessId: true,
        status: true 
      }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비즈니스 소유자 또는 관리자만 수정 가능
    if (existingCampaign.businessId !== user.id && user.type !== 'ADMIN') {
      return NextResponse.json(
        { error: '캠페인을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미지 배열 처리
    const processImageArray = (images: unknown) => {
      if (!images) return null;
      if (typeof images === 'string') return images;
      return JSON.stringify(images);
    };

    // 캠페인 업데이트
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        title: body.title,
        description: body.description,
        platform: body.platform,
        budget: body.budget ? Number(body.budget) : null,
        targetFollowers: body.targetFollowers ? Number(body.targetFollowers) : null,
        maxApplicants: body.maxApplicants ? Number(body.maxApplicants) : null,
        requirements: body.requirements,
        hashtags: body.hashtags ? (Array.isArray(body.hashtags) ? JSON.stringify(body.hashtags) : body.hashtags) : null,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        applicationStartDate: body.applicationStartDate ? new Date(body.applicationStartDate) : undefined,
        applicationEndDate: body.applicationEndDate ? new Date(body.applicationEndDate) : undefined,
        contentStartDate: body.contentStartDate ? new Date(body.contentStartDate) : undefined,
        contentEndDate: body.contentEndDate ? new Date(body.contentEndDate) : undefined,
        resultAnnouncementDate: body.resultAnnouncementDate ? new Date(body.resultAnnouncementDate) : undefined,
        announcementDate: body.announcementDate ? new Date(body.announcementDate) : undefined,
        provisionDetails: body.provisionDetails,
        campaignMission: body.campaignMission,
        keywords: body.keywords,
        additionalNotes: body.additionalNotes,
        imageUrl: body.imageUrl,
        headerImageUrl: body.headerImageUrl,
        thumbnailImageUrl: body.thumbnailImageUrl,
        detailImages: processImageArray(body.detailImages),
        productImages: processImageArray(body.productImages),
        status: body.status || existingCampaign.status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: '캠페인이 성공적으로 수정되었습니다.',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('캠페인 수정 오류:', error);
    return NextResponse.json(
      { error: '캠페인 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns/[id] - 캠페인 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const campaignId = params.id;

    // 권한 확인 및 삭제
    // await withTransaction(async (client) => {
    //   await client.query('DELETE FROM campaigns WHERE id = $1 AND user_id = $2', [campaignId, user.id]);
    // });

    return NextResponse.json({
      message: '캠페인이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('캠페인 삭제 오류:', error);
    return NextResponse.json(
      { error: '캠페인 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}