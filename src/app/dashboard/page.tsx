"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/lib/auth/protected-route";
import { useUserData } from "@/contexts/UserDataContext";
import {
  useInfluencerStats,
  useLikedCampaigns,
  useInfluencerApplications,
  useInfluencerWithdrawals,
} from "@/hooks/useSharedData";
import {
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Settings,
  CreditCard,
  Link as LinkIcon,
  Star,
  BarChart3,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

function DashboardContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { profileData } = useUserData();

  // 캐싱된 데이터 사용
  const { data: statsData, isLoading: statsLoading } = useInfluencerStats();
  const { data: applicationsData, isLoading: applicationsLoading } =
    useInfluencerApplications();
  const { data: withdrawalsData, isLoading: withdrawalsLoading } =
    useInfluencerWithdrawals();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // 관리자인 경우 어드민 페이지로 리다이렉트
    const userType = user.type?.toUpperCase();
    if (userType === "ADMIN") {
      router.push("/admin");
      return;
    }

    // 비즈니스 사용자인 경우 비즈니스 대시보드로 리다이렉트
    if (userType === "BUSINESS") {
      router.push("/business/dashboard");
      return;
    }
  }, [router, user, isAuthenticated, isLoading]);

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {t("common.loading", "로딩 중...")}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userType = user.type?.toUpperCase();
  const stats = statsData?.stats || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalViews: 0,
    followers: 0,
  };

  const applications = applicationsData || [];
  const withdrawals = withdrawalsData || {
    withdrawableAmount: 0,
    settlements: [],
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 서브 히어로 섹션 - 비즈니스 대시보드와 동일한 스타일 */}
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="max-w-4xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                {t("dashboard.greeting", "안녕하세요, {name}님! 👋").replace(
                  "{name}",
                  profileData?.name ||
                    user?.name ||
                    user?.email ||
                    t("dashboard.default_name", "인플루언서"),
                )}
              </h1>
              <p className="text-base sm:text-lg text-white/80 mb-4 sm:mb-6">
                {t(
                  "dashboard.subtitle",
                  "오늘도 멋진 콘텐츠로 세상과 소통해보세요.",
                )}
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/campaigns"
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {t("dashboard.explore_campaigns", "캠페인 탐색")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 메인 컨텐츠 */}
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
          {/* 통계 카드 - 비즈니스 대시보드와 동일한 스타일 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {t("dashboard.stats.total_campaigns", "참여 캠페인")}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                    {stats.totalCampaigns}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                  <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {t(
                  "dashboard.stats.total_campaigns_desc",
                  "총 참여한 캠페인 수",
                )}
              </p>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {t("dashboard.stats.active_campaigns", "진행중 캠페인")}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                    {stats.activeCampaigns}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {t("dashboard.stats.active_campaigns_desc", "현재 진행중")}
              </p>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {t("dashboard.stats.total_earnings", "총 수익")}
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                    ₩{stats.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {t("dashboard.stats.total_earnings_desc", "누적 수익 금액")}
              </p>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                    {t("dashboard.stats.average_rating", "평균 평점")}
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                    {stats.averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                  <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {t("dashboard.stats.average_rating_desc", "클라이언트 평점")}
              </p>
            </div>
          </div>

          {/* 빠른 액션 메뉴 */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              {t("dashboard.quick_actions", "빠른 메뉴")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/campaigns"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">
                  {t("dashboard.menu.campaigns", "캠페인 관리")}
                </span>
              </Link>

              <Link
                href="/dashboard/applications"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">
                  {t("dashboard.menu.applications", "지원 내역")}
                </span>
              </Link>

              <Link
                href="/dashboard/payments"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">
                  {t("dashboard.menu.payments", "정산 관리")}
                </span>
              </Link>

              <Link
                href="/dashboard/settings"
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">
                  {t("dashboard.menu.settings", "계정 설정")}
                </span>
              </Link>
            </div>
          </div>

          {/* 최근 활동 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 최근 지원한 캠페인 */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("dashboard.recent_applications", "최근 지원 내역")}
                </h3>
                <Link
                  href="/dashboard/applications"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  {t("common.view_all", "전체보기")}
                </Link>
              </div>
              <div className="space-y-3">
                {applications.slice(0, 3).map((application: any) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {application.campaign?.title || "캠페인 정보 없음"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(application.appliedAt).toLocaleDateString(
                          "ko-KR",
                        )}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        application.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : application.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {application.status === "APPROVED"
                        ? "승인됨"
                        : application.status === "REJECTED"
                          ? "거절됨"
                          : "검토중"}
                    </span>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    {t("dashboard.no_applications", "지원 내역이 없습니다.")}
                  </p>
                )}
              </div>
            </div>

            {/* 정산 정보 */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("dashboard.payment_summary", "정산 현황")}
                </h3>
                <Link
                  href="/dashboard/payments"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  {t("common.view_all", "전체보기")}
                </Link>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">
                      {t("dashboard.withdrawable_amount", "출금 가능 금액")}
                    </span>
                    <span className="text-lg font-bold text-green-900">
                      ₩{withdrawals.withdrawableAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    {t("dashboard.recent_settlements", "최근 정산 내역")}
                  </h4>
                  {withdrawals.settlements
                    .slice(0, 3)
                    .map((settlement: any) => (
                      <div
                        key={settlement.id}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 truncate">
                            {new Date(settlement.createdAt).toLocaleDateString(
                              "ko-KR",
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          ₩{settlement.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  {withdrawals.settlements.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">
                      {t("dashboard.no_settlements", "정산 내역이 없습니다.")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
