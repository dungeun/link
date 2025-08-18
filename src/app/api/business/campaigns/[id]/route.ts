import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// API 라우트를 동적으로 설정 (정적 생성 방지)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 인증 미들웨어
async function authenticate(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }
  
  // Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('authorization');
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // 쿠키에서 토큰 추출 (폴백)
    const cookieStore = cookies();
    token = cookieStore.get('auth-token')?.value;
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; userId?: string; email: string; type: string; name: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/business/campaigns/[id] - 캠페인 상세 조회
export async function GET(
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
    
    const userType = user.type?.toLowerCase();
    if (userType !== 'business' && userType !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 캠페인 조회
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: params.id
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            businessProfile: {
              select: {
                companyName: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 소유자 확인
    if (campaign.businessId !== (user.userId || user.id) && userType !== 'admin') {
      return NextResponse.json(
        { error: '해당 캠페인에 대한 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 해시태그 파싱
    let hashtags = [];
    if (campaign.hashtags) {
      try {
        hashtags = JSON.parse(campaign.hashtags as string);
      } catch (e) {
        // JSON 파싱 실패 시 공백으로 분리
        hashtags = (campaign.hashtags as string).split(' ').filter(tag => tag);
      }
    }
    
    // 플랫폼 파싱
    let platforms = [];
    try {
      platforms = campaign.platforms ? JSON.parse(campaign.platforms as string) : [campaign.platform];
    } catch (e) {
      platforms = [campaign.platform];
    }
    
    // 상세 이미지 파싱
    let detailImages = [];
    try {
      detailImages = campaign.detailImages ? JSON.parse(String(campaign.detailImages)) : [];
    } catch (e) {
      detailImages = [];
    }

    // 캠페인 데이터 형식 변환
    const formattedCampaign = {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      platform: campaign.platform,
      platforms: platforms,
      budget: campaign.budget,
      targetFollowers: campaign.targetFollowers,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      requirements: campaign.requirements,
      hashtags: hashtags,
      imageUrl: campaign.imageUrl,
      detailImages: detailImages,
      status: campaign.status,
      maxApplicants: campaign.maxApplicants,
      rewardAmount: campaign.rewardAmount,
      location: campaign.location,
      _count: campaign._count,
      createdAt: campaign.createdAt,
      business: campaign.business
    };

    return NextResponse.json({
      campaign: formattedCampaign
    });
  } catch (error) {
    console.error('캠페인 조회 오류:', error);
    return NextResponse.json(
      { error: '캠페인 조회에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/business/campaigns/[id] - 캠페인 수정
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
    
    const userType = user.type?.toLowerCase();
    if (userType !== 'business' && userType !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 캠페인 존재 여부 및 소유자 확인
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: params.id }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingCampaign.businessId !== (user.userId || user.id) && userType !== 'admin') {
      return NextResponse.json(
        { error: '해당 캠페인을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // 수정 가능한 필드만 업데이트
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.requirements !== undefined) updateData.requirements = body.requirements;
    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.targetFollowers !== undefined) updateData.targetFollowers = body.targetFollowers;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.hashtags !== undefined) updateData.hashtags = JSON.stringify(body.hashtags);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.platforms !== undefined) updateData.platforms = JSON.stringify(body.platforms);
    if (body.detailImages !== undefined) updateData.detailImages = JSON.stringify(body.detailImages);

    // 캠페인 업데이트
    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      message: '캠페인이 성공적으로 수정되었습니다.',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('캠페인 수정 오류:', error);
    return NextResponse.json(
      { error: '캠페인 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/business/campaigns/[id] - 캠페인 삭제
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
    
    const userType = user.type?.toLowerCase();
    if (userType !== 'business' && userType !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 캠페인 존재 여부 및 소유자 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (campaign.businessId !== (user.userId || user.id) && userType !== 'admin') {
      return NextResponse.json(
        { error: '해당 캠페인을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 캠페인 삭제
    await prisma.campaign.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: '캠페인이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('캠페인 삭제 오류:', error);
    return NextResponse.json(
      { error: '캠페인 삭제에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
