import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { jwtConfig } from '@/lib/auth/jwt-config';

// API 라우트를 동적으로 설정 (정적 생성 방지)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 인증 미들웨어
async function authenticate(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const secrets = jwtConfig.getSecrets();
    if (!secrets.isValid) {
      console.error('JWT configuration error:', secrets.error);
      return null;
    }

    const decoded = jwt.verify(token, secrets.jwtSecret!) as any;
    return decoded;
  } catch (error) {
    
    return null;
  }
}

// GET /api/business/stats - 비즈니스 통계 조회
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    
    if (!user || user.type !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 비즈니스 사용자의 캠페인 통계 조회
    const campaigns = await prisma.campaign.findMany({
      where: {
        businessId: user.id || user.userId
      },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    // 통계 계산
    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
      totalApplications: campaigns.reduce((sum, c) => sum + c._count.applications, 0),
      pendingApplications: 0, // TODO: 실제 pending 상태 계산 필요
      completedCampaigns: campaigns.filter(c => c.status === 'COMPLETED').length,
      totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Business stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}