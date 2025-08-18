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
  const cookieStore = cookies();
  let token = cookieStore.get('auth-token')?.value;

  // 쿠키에서 토큰이 없으면 Authorization 헤더에서 확인
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/business/campaigns/[id]/applications - 캠페인 지원자 목록 조회
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
        { error: '해당 캠페인의 지원자를 볼 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 지원자 목록 조회
    const applications = await prisma.campaignApplication.findMany({
      where: {
        campaignId: params.id
      },
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                instagram: true,
                instagramFollowers: true,
                averageEngagementRate: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 지원자 데이터 형식 변환
    const formattedApplications = applications.map(app => ({
      id: app.id,
      influencerId: app.influencer?.id,
      influencerName: app.influencer?.name,
      influencerHandle: app.influencer?.profile?.instagram || app.influencer?.email.split('@')[0],
      followers: app.influencer?.profile?.instagramFollowers || 0,
      engagementRate: app.influencer?.profile?.averageEngagementRate || 0,
      status: app.status.toLowerCase(),
      message: app.message || '',
      appliedAt: app.createdAt
    }));

    return NextResponse.json({
      applications: formattedApplications
    });
  } catch (error) {
    console.error('지원자 조회 오류:', error);
    return NextResponse.json(
      { error: '지원자 조회에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
