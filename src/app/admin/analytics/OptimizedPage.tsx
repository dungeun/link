"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiGet } from "@/lib/api/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";

// Lazy load heavy chart components
const ChartComponents = lazy(
  () => import("@/components/admin/analytics/ChartComponents"),
);

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCampaigns: number;
    totalRevenue: number;
    totalSettlements: number;
    userGrowth: number;
    revenueGrowth: number;
  };
  userStats: {
    byType: Array<{ type: string; count: number }>;
    byMonth: Array<{ month: string; influencers: number; businesses: number }>;
  };
  campaignStats: {
    byStatus: Array<{ status: string; count: number }>;
    byCategory: Array<{ category: string; count: number }>;
    byMonth: Array<{ month: string; count: number; revenue: number }>;
  };
  revenueStats: {
    byMonth: Array<{ month: string; amount: number }>;
    byPaymentMethod: Array<{ method: string; amount: number }>;
  };
  topInfluencers: Array<{
    id: string;
    name: string;
    email: string;
    campaigns: number;
    earnings: number;
  }>;
  topCampaigns: Array<{
    id: string;
    title: string;
    business: string;
    revenue: number;
    applications: number;
  }>;
}

export default function OptimizedAnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30days");

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.type !== "ADMIN") {
        router.push("/admin/login");
      } else {
        fetchAnalytics();
      }
    }
  }, [user, authLoading, router, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await apiGet(`/api/admin/analytics?range=${dateRange}`);
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">분석 대시보드</h1>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7days">최근 7일</option>
            <option value="30days">최근 30일</option>
            <option value="90days">최근 90일</option>
            <option value="1year">1년</option>
          </select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">총 사용자</div>
            <div className="text-2xl font-bold">
              {data.overview.totalUsers.toLocaleString()}
            </div>
            <div
              className={`text-sm ${data.overview.userGrowth > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {data.overview.userGrowth > 0 ? "+" : ""}
              {data.overview.userGrowth}%
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">활성 캠페인</div>
            <div className="text-2xl font-bold">
              {data.overview.totalCampaigns}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">총 매출</div>
            <div className="text-2xl font-bold">
              ₩{data.overview.totalRevenue.toLocaleString()}
            </div>
            <div
              className={`text-sm ${data.overview.revenueGrowth > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {data.overview.revenueGrowth > 0 ? "+" : ""}
              {data.overview.revenueGrowth}%
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">정산 완료</div>
            <div className="text-2xl font-bold">
              ₩{data.overview.totalSettlements.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Charts - Lazy Loaded */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
        >
          <ChartComponents data={data} />
        </Suspense>

        {/* Top Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Top Influencers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">TOP 인플루언서</h2>
            <div className="space-y-3">
              {data.topInfluencers.map((influencer, index) => (
                <div
                  key={influencer.id}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-400 mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{influencer.name}</div>
                      <div className="text-sm text-gray-500">
                        {influencer.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ₩{influencer.earnings.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {influencer.campaigns}개 캠페인
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Campaigns */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">TOP 캠페인</h2>
            <div className="space-y-3">
              {data.topCampaigns.map((campaign, index) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-400 mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-medium">{campaign.title}</div>
                      <div className="text-sm text-gray-500">
                        {campaign.business}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ₩{campaign.revenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {campaign.applications}개 지원
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
