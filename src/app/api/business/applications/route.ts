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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; userId?: string; email: string; type: string; name: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/business/applications - 비즈니스의 모든 지원서 조회
export async function GET(request: NextRequest) {
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

    // 해당 비즈니스의 모든 캠페인 ID 조회
    const campaigns = await prisma.campaign.findMany({
      where: {
        businessId: user.userId || user.id
      },
      select: {
        id: true,
        title: true
      }
    });

    const campaignIds = campaigns.map(c => c.id);
    const campaignMap = Object.fromEntries(campaigns.map(c => [c.id, c.title]));

    // 모든 지원서 조회
    const applications = await prisma.campaignApplication.findMany({
      where: {
        campaignId: {
          in: campaignIds
        }
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
        },
        campaign: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 지원서 데이터 형식 변환 (undefined 안전 처리)
    const formattedApplications = applications.map(app => {
      const influencer = app.influencer || {};
      const campaign = app.campaign || {};
      const profile = influencer.profile || {};
      
      return {
        id: app.id || '',
        campaignId: app.campaignId || '',
        campaignTitle: campaign.title || '알 수 없는 캠페인',
        influencerId: influencer.id || '',
        influencerName: influencer.name || '알 수 없는 인플루언서',
        influencerHandle: profile.instagram || (influencer.email ? influencer.email.split('@')[0] : '미설정'),
        followers: profile.instagramFollowers || 0,
        engagementRate: profile.averageEngagementRate || 0,
        status: (app.status || 'PENDING').toLowerCase(),
        message: app.message || '',
        appliedAt: app.createdAt || new Date()
      };
    });

    return NextResponse.json({
      applications: formattedApplications,
      campaigns: campaigns
    });
  } catch (error) {
    console.error('지원서 조회 오류:', error);
    return NextResponse.json(
      { error: '지원서 조회에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}