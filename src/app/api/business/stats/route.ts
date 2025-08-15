import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string; type?: string; email?: string };
    return decoded;
  } catch (error) {
    
    return null;
  }
}

// GET /api/business/stats - 비즈니스 통계 조회
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
        { error: '비즈니스 계정만 접근 가능합니다.' },
        { status: 403 }
      );
    }

    // 비즈니스 정보 조회 - 기본 정보만
    const business = await prisma.user.findUnique({
      where: { id: user.userId || user.id },
      select: { id: true, name: true }
    });

    if (!business) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // 통계 계산을 위한 최적화된 쿼리들 - 병렬 실행
    const [
      campaignStats,
      totalApplicationsCount,
      totalSpentAmount,
      recentCampaignsData,
      recentApplicationsData
    ] = await Promise.all([
      // 캠페인 기본 통계
      prisma.campaign.aggregate({
        where: { businessId },
        _count: { id: true }
      }),
      
      // 총 지원자 수
      prisma.campaignApplication.count({
        where: {
          campaign: { businessId }
        }
      }),
      
      // 총 지출 (완료된 캠페인의 예산 합계)
      prisma.campaign.aggregate({
        where: { 
          businessId,
          status: 'COMPLETED'
        },
        _sum: { budget: true }
      }),
      
      // 최근 캠페인 목록 (최대 5개) - 지원자 수 포함
      prisma.campaign.findMany({
        where: { businessId },
        select: {
          id: true,
          title: true,
          status: true,
          budget: true,
          endDate: true,
          createdAt: true,
          _count: {
            select: { applications: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // 최근 지원자 목록 (최대 5개)
      prisma.campaignApplication.findMany({
        where: {
          campaign: { businessId }
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          campaign: {
            select: { title: true }
          },
          influencer: {
            select: {
              name: true,
              profile: {
                select: { followerCount: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // 활성 캠페인 수 별도 조회
    const activeCampaignsCount = await prisma.campaign.count({
      where: { 
        businessId,
        status: 'ACTIVE'
      }
    });

    // 통계 데이터 포맷팅
    const totalCampaigns = campaignStats._count.id;
    const activeCampaigns = activeCampaignsCount;
    const totalApplications = totalApplicationsCount;
    const totalSpent = totalSpentAmount._sum.budget || 0;

    // 최근 캠페인 포맷팅
    const recentCampaigns = recentCampaignsData.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      status: campaign.status.toLowerCase(),
      applications: campaign._count.applications,
      maxApplications: 100, // TODO: 실제 최대 지원자 수 필드 추가
      budget: `₩${campaign.budget.toLocaleString()}`,
      deadline: campaign.endDate < new Date() ? '완료' : getDeadlineText(campaign.endDate),
      category: 'general' // TODO: 카테고리 필드 추가
    }));

    // 최근 지원자 포맷팅
    const recentApplications = recentApplicationsData.map(app => ({
      id: app.id,
      campaignTitle: app.campaign.title,
      influencerName: app.influencer.name,
      followers: app.influencer.profile?.followerCount 
        ? `${(app.influencer.profile.followerCount / 1000).toFixed(0)}K`
        : '0',
      engagementRate: '4.2%', // TODO: 실제 참여율 계산
      appliedAt: getRelativeTime(app.createdAt),
      status: app.status
    }));

    return NextResponse.json({
      stats: {
        totalCampaigns,
        activeCampaigns,
        totalApplications,
        totalSpent
      },
      campaigns: recentCampaigns,
      recentApplications
    });
  } catch (error) {
    console.error('비즈니스 통계 조회 오류:', error);
    return NextResponse.json(
      { error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 마감일 텍스트 계산 헬퍼 함수
function getDeadlineText(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) {
    return '완료';
  } else if (days === 0) {
    return '오늘 마감';
  } else if (days === 1) {
    return '내일 마감';
  } else if (days <= 7) {
    return `${days}일 후 마감`;
  } else {
    return `D-${days}`;
  }
}

// 상대 시간 계산 헬퍼 함수
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return '방금 전';
  }
}