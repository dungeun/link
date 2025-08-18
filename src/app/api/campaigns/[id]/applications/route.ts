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
  const token = cookieStore.get('auth-token')?.value;

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

// GET /api/campaigns/[id]/applications - 캠페인 지원자 목록 조회
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

    // 캠페인 조회
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        businessId: true
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (캠페인 소유자이거나 관리자만 볼 수 있음)
    const userType = user.type?.toLowerCase();
    if (campaign.businessId !== (user.userId || user.id) && userType !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
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
          include: {
            profile: true,
            _count: {
              select: {
                applications: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      applications: applications.map(app => ({
        id: app.id,
        campaignId: app.campaignId,
        influencerId: app.influencerId,
        message: app.message,
        proposedPrice: app.proposedPrice,
        status: app.status,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        influencer: {
          id: app.influencer.id,
          name: app.influencer.name,
          email: app.influencer.email,
          profile: app.influencer.profile,
          _count: app.influencer._count
        }
      }))
    });
  } catch (error) {
    console.error('지원자 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '지원자 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
