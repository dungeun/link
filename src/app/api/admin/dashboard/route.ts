import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";
import { AdminCache } from "@/lib/cache/admin-cache";
import { logger } from "@/lib/logger/structured-logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/admin/dashboard - 최적화된 관리자 대시보드 통계
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authResult = await requireAdminAuth(request);
    if (authResult.error) {
      return authResult.error;
    }

    // 캐시 확인
    const cached = await AdminCache.getDashboardStats();
    if (cached) {
      logger.info("Dashboard data served from cache");
      return NextResponse.json(cached);
    }

    // 병렬 쿼리 실행 - 최적화된 버전
    const startTime = Date.now();

    // 날짜 계산 (재사용)
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 병렬 쿼리 그룹 1: 카운트 쿼리들
    const [
      totalUsers,
      activeUsers,
      totalCampaigns,
      activeCampaigns,
      newUsersToday,
      previousMonthUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { lastLogin: { gte: sevenDaysAgo } },
      }),
      prisma.campaign.count(),
      prisma.campaign.count({
        where: { status: "ACTIVE" },
      }),
      prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.user.count({
        where: { createdAt: { lt: thirtyDaysAgo } },
      }),
    ]);

    // 병렬 쿼리 그룹 2: 승인 대기 및 결제
    const [pendingBusinessProfiles, pendingInfluencerProfiles, totalPayments] =
      await Promise.all([
        prisma.businessProfile.count({
          where: { isVerified: false },
        }),
        prisma.profile.count({
          where: { isVerified: false },
        }),
        prisma.payment.aggregate({
          where: { status: "COMPLETED" },
          _sum: { amount: true },
        }),
      ]);

    // 병렬 쿼리 그룹 3: 최근 활동 (선택적 로딩)
    const [recentUsers, recentCampaigns, recentApplications, recentPayments] =
      await Promise.all([
        prisma.user.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            type: true,
            createdAt: true,
          },
        }),
        prisma.campaign.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            createdAt: true,
            business: {
              select: {
                name: true,
                businessProfile: {
                  select: { companyName: true },
                },
              },
            },
          },
        }),
        prisma.campaignApplication.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            createdAt: true,
            campaign: {
              select: { title: true },
            },
            influencer: {
              select: { name: true },
            },
          },
        }),
        prisma.payment.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          where: { status: "COMPLETED" },
          select: {
            id: true,
            amount: true,
            createdAt: true,
            campaign: {
              select: { title: true },
            },
          },
        }),
      ]);

    // 성장률 계산
    const growth =
      previousMonthUsers > 0
        ? (
            ((totalUsers - previousMonthUsers) / previousMonthUsers) *
            100
          ).toFixed(1)
        : 0;

    // 최근 활동 포맷팅 (간소화)
    const recentActivities = [
      ...recentUsers.map((user) => ({
        id: `user-${user.id}`,
        type: "user_registered",
        title: "새 사용자 가입",
        description: `${user.type === "BUSINESS" ? "비즈니스" : "인플루언서"} "${user.name}"`,
        time: getRelativeTime(user.createdAt),
        icon: "👤",
      })),
      ...recentCampaigns.map((campaign) => ({
        id: `campaign-${campaign.id}`,
        type: "campaign_created",
        title: "새 캠페인",
        description: `"${campaign.title}"`,
        time: getRelativeTime(campaign.createdAt),
        icon: "📢",
      })),
      ...recentApplications.map((app) => ({
        id: `app-${app.id}`,
        type: "application_submitted",
        title: "캠페인 지원",
        description: `${app.influencer.name} → "${app.campaign.title}"`,
        time: getRelativeTime(app.createdAt),
        icon: "📝",
      })),
    ].slice(0, 5); // 5개만 표시

    // 시스템 알림
    const pendingApprovals =
      pendingBusinessProfiles + pendingInfluencerProfiles;
    const systemAlerts =
      pendingApprovals > 0
        ? [
            {
              id: "pending-approvals",
              type: "warning" as const,
              message: `${pendingApprovals}개의 프로필이 승인 대기 중입니다.`,
              time: "지금",
            },
          ]
        : [];

    // 응답 데이터
    const responseData = {
      stats: {
        totalUsers,
        activeUsers,
        totalCampaigns,
        activeCampaigns,
        revenue: totalPayments._sum.amount || 0,
        growth: Number(growth),
        newUsers: newUsersToday,
        pendingApprovals,
      },
      recentActivities,
      systemAlerts,
    };

    // 캐시 저장
    await AdminCache.setDashboardStats(responseData);

    const queryTime = Date.now() - startTime;
    logger.info(`Dashboard data loaded in ${queryTime}ms`);

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error(
      "Dashboard API error:",
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json(
      { error: "대시보드 데이터를 불러오는데 실패했습니다." },
      { status: 500 },
    );
  }
}

// 상대 시간 계산 (간소화)
function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return new Date(date).toLocaleDateString("ko-KR");
}
