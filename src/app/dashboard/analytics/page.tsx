"use client";

import { useState } from "react";

export default function AdminAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  const periodOptions = [
    { value: "7days", label: "최근 7일" },
    { value: "30days", label: "최근 30일" },
    { value: "90days", label: "최근 90일" },
    { value: "1year", label: "1년" },
  ];

  const metricOptions = [
    { value: "revenue", label: "수익" },
    { value: "campaigns", label: "캠페인" },
    { value: "influencers", label: "인플루언서" },
    { value: "engagement", label: "참여율" },
  ];

  // Mock analytics data
  const analytics = {
    overview: {
      totalRevenue: 45230000,
      revenueGrowth: 18.5,
      totalCampaigns: 156,
      campaignGrowth: 12.3,
      activeInfluencers: 89,
      influencerGrowth: 25.8,
      averageEngagement: 5.2,
      engagementGrowth: 8.7,
    },
    chartData: {
      revenue: [
        { date: "2025-06-01", value: 1200000 },
        { date: "2025-06-08", value: 1450000 },
        { date: "2025-06-15", value: 1680000 },
        { date: "2025-06-22", value: 1920000 },
        { date: "2025-06-29", value: 2100000 },
      ],
      campaigns: [
        { date: "2025-06-01", value: 12 },
        { date: "2025-06-08", value: 15 },
        { date: "2025-06-15", value: 18 },
        { date: "2025-06-22", value: 22 },
        { date: "2025-06-29", value: 25 },
      ],
    },
    topPerforming: {
      campaigns: [
        {
          name: "2025 신제품 런칭 캠페인",
          revenue: 5200000,
          roi: 340,
          participants: 12,
        },
        {
          name: "여름 컬렉션 스타일링",
          revenue: 3800000,
          roi: 280,
          participants: 8,
        },
        {
          name: "AI 앱 베타 테스트",
          revenue: 3200000,
          roi: 250,
          participants: 6,
        },
        {
          name: "프리미엄 레스토랑 체험",
          revenue: 2900000,
          roi: 220,
          participants: 5,
        },
      ],
      influencers: [
        {
          name: "뷰티크리에이터A",
          revenue: 8500000,
          campaigns: 15,
          avgEngagement: 6.2,
        },
        {
          name: "패션인플루언서B",
          revenue: 6200000,
          campaigns: 12,
          avgEngagement: 5.8,
        },
        {
          name: "피트니스트레이너E",
          revenue: 4800000,
          campaigns: 10,
          avgEngagement: 7.1,
        },
        {
          name: "푸드블로거C",
          revenue: 3200000,
          campaigns: 8,
          avgEngagement: 6.5,
        },
      ],
      categories: [
        { name: "뷰티", revenue: 18500000, campaigns: 45, avgEngagement: 5.8 },
        { name: "패션", revenue: 12800000, campaigns: 38, avgEngagement: 5.2 },
        { name: "푸드", revenue: 8900000, campaigns: 25, avgEngagement: 6.1 },
        { name: "테크", revenue: 5030000, campaigns: 18, avgEngagement: 4.9 },
      ],
    },
    insights: [
      {
        type: "growth",
        title: "뷰티 카테고리 급성장",
        description: "뷰티 카테고리의 수익이 지난 달 대비 35% 증가했습니다.",
        impact: "high",
        action: "뷰티 인플루언서 확보 전략 수립 필요",
      },
      {
        type: "opportunity",
        title: "테크 카테고리 잠재력",
        description:
          "테크 카테고리의 평균 캠페인 예산이 타 카테고리 대비 40% 높습니다.",
        impact: "medium",
        action: "테크 전문 인플루언서 영입 고려",
      },
      {
        type: "warning",
        title: "일부 인플루언서 참여율 하락",
        description: "5명의 인플루언서에서 참여율이 20% 이상 감소했습니다.",
        impact: "medium",
        action: "개별 상담 및 컨텐츠 품질 개선 지원",
      },
    ],
  };

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? "📈" : growth < 0 ? "📉" : "➡️";
  };

  const getGrowthColor = (growth: number) => {
    return growth > 0
      ? "text-green-600"
      : growth < 0
        ? "text-red-600"
        : "text-gray-600";
  };

  const getInsightIcon = (type: string) => {
    const iconMap = {
      growth: "🚀",
      opportunity: "💡",
      warning: "⚠️",
      info: "ℹ️",
    };
    return iconMap[type as keyof typeof iconMap] || "ℹ️";
  };

  const getInsightColor = (impact: string) => {
    const colorMap = {
      high: "border-red-200 bg-red-50",
      medium: "border-yellow-200 bg-yellow-50",
      low: "border-blue-200 bg-blue-50",
    };
    return (
      colorMap[impact as keyof typeof colorMap] || "border-gray-200 bg-gray-50"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">분석 대시보드</h1>
          <p className="text-gray-600">플랫폼 성과와 트렌드를 분석하세요</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            리포트 생성
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              💰
            </div>
            <span
              className={`text-sm font-medium ${getGrowthColor(analytics.overview.revenueGrowth)}`}
            >
              {getGrowthIcon(analytics.overview.revenueGrowth)}{" "}
              {analytics.overview.revenueGrowth}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₩{(analytics.overview.totalRevenue / 1000000).toFixed(1)}M
          </h3>
          <p className="text-gray-600 text-sm">총 수익</p>
        </div>

        <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              📢
            </div>
            <span
              className={`text-sm font-medium ${getGrowthColor(analytics.overview.campaignGrowth)}`}
            >
              {getGrowthIcon(analytics.overview.campaignGrowth)}{" "}
              {analytics.overview.campaignGrowth}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analytics.overview.totalCampaigns}
          </h3>
          <p className="text-gray-600 text-sm">총 캠페인</p>
        </div>

        <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              👥
            </div>
            <span
              className={`text-sm font-medium ${getGrowthColor(analytics.overview.influencerGrowth)}`}
            >
              {getGrowthIcon(analytics.overview.influencerGrowth)}{" "}
              {analytics.overview.influencerGrowth}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analytics.overview.activeInfluencers}
          </h3>
          <p className="text-gray-600 text-sm">활성 인플루언서</p>
        </div>

        <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              📊
            </div>
            <span
              className={`text-sm font-medium ${getGrowthColor(analytics.overview.engagementGrowth)}`}
            >
              {getGrowthIcon(analytics.overview.engagementGrowth)}{" "}
              {analytics.overview.engagementGrowth}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {analytics.overview.averageEngagement}%
          </h3>
          <p className="text-gray-600 text-sm">평균 참여율</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">성과 트렌드</h2>
          <div className="flex gap-2">
            {metricOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedMetric(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === option.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simple Chart Visualization */}
        <div className="h-64 flex items-end space-x-2">
          {analytics.chartData.revenue.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-indigo-500 rounded-t transition-all duration-300 hover:bg-indigo-600"
                style={{
                  height: `${(data.value / Math.max(...analytics.chartData.revenue.map((d) => d.value))) * 200}px`,
                }}
              ></div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                {data.date.slice(5)}
              </div>
              <div className="text-xs text-gray-700 font-medium">
                ₩{(data.value / 1000000).toFixed(1)}M
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Campaigns */}
        <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            최고 성과 캠페인
          </h3>
          <div className="space-y-4">
            {analytics.topPerforming.campaigns.map((campaign, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {campaign.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {campaign.participants}명 참여 • ROI {campaign.roi}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    ₩{(campaign.revenue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Influencers */}
        <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            최고 성과 인플루언서
          </h3>
          <div className="space-y-4">
            {analytics.topPerforming.influencers.map((influencer, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <img
                    src="https://images.unsplash.com/photo-1494790108755-2616c9c3e0e6?w=32&h=32&fit=crop&crop=face"
                    alt={influencer.name}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {influencer.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {influencer.campaigns}개 캠페인 •{" "}
                      {influencer.avgEngagement}% 참여율
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    ₩{(influencer.revenue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            카테고리별 성과
          </h3>
          <div className="space-y-4">
            {analytics.topPerforming.categories.map((category, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {category.campaigns}개 캠페인 • {category.avgEngagement}%
                    참여율
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    ₩{(category.revenue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="analytics-card bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          인사이트 및 추천
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {analytics.insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 ${getInsightColor(insight.impact)}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {insight.description}
                  </p>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    <strong>추천:</strong> {insight.action}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
