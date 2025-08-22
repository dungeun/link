"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminInfluencersPage() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const influencers = [
    {
      id: 1,
      name: "뷰티크리에이터A",
      email: "beauty@example.com",
      category: "beauty",
      status: "active",
      tier: "premium",
      followers: 125300,
      engagement: 4.8,
      completedCampaigns: 23,
      averageRating: 4.9,
      totalEarnings: 12500000,
      joinDate: "2024-03-15",
      lastActive: "2025-06-25",
      platforms: ["instagram", "youtube"],
    },
    {
      id: 2,
      name: "패션인플루언서B",
      email: "fashion@example.com",
      category: "fashion",
      status: "active",
      tier: "gold",
      followers: 89200,
      engagement: 5.2,
      completedCampaigns: 18,
      averageRating: 4.7,
      totalEarnings: 8900000,
      joinDate: "2024-05-20",
      lastActive: "2025-06-24",
      platforms: ["instagram", "tiktok"],
    },
    {
      id: 3,
      name: "푸드블로거C",
      email: "food@example.com",
      category: "food",
      status: "pending",
      tier: "silver",
      followers: 45600,
      engagement: 6.1,
      completedCampaigns: 8,
      averageRating: 4.8,
      totalEarnings: 3200000,
      joinDate: "2024-08-10",
      lastActive: "2025-06-23",
      platforms: ["instagram", "blog"],
    },
    {
      id: 4,
      name: "테크리뷰어D",
      email: "tech@example.com",
      category: "tech",
      status: "inactive",
      tier: "bronze",
      followers: 28900,
      engagement: 3.9,
      completedCampaigns: 5,
      averageRating: 4.5,
      totalEarnings: 1800000,
      joinDate: "2024-11-05",
      lastActive: "2025-05-10",
      platforms: ["youtube", "blog"],
    },
    {
      id: 5,
      name: "피트니스트레이너E",
      email: "fitness@example.com",
      category: "fitness",
      status: "active",
      tier: "gold",
      followers: 67800,
      engagement: 5.7,
      completedCampaigns: 15,
      averageRating: 4.8,
      totalEarnings: 6700000,
      joinDate: "2024-04-12",
      lastActive: "2025-06-26",
      platforms: ["instagram", "youtube", "tiktok"],
    },
  ];

  const statusOptions = [
    { value: "all", label: "전체", count: influencers.length },
    {
      value: "active",
      label: "활성",
      count: influencers.filter((i) => i.status === "active").length,
    },
    {
      value: "pending",
      label: "대기",
      count: influencers.filter((i) => i.status === "pending").length,
    },
    {
      value: "inactive",
      label: "비활성",
      count: influencers.filter((i) => i.status === "inactive").length,
    },
  ];

  const categories = [
    { value: "all", label: "전체 카테고리" },
    { value: "beauty", label: "뷰티" },
    { value: "fashion", label: "패션" },
    { value: "food", label: "푸드" },
    { value: "tech", label: "테크" },
    { value: "fitness", label: "피트니스" },
  ];

  const tiers = [
    { value: "all", label: "전체 등급" },
    { value: "premium", label: "프리미엄" },
    { value: "gold", label: "골드" },
    { value: "silver", label: "실버" },
    { value: "bronze", label: "브론즈" },
  ];

  const filteredInfluencers = influencers.filter((influencer) => {
    const matchesStatus =
      selectedStatus === "all" || influencer.status === selectedStatus;
    const matchesCategory =
      selectedCategory === "all" || influencer.category === selectedCategory;
    const matchesTier =
      selectedTier === "all" || influencer.tier === selectedTier;
    const matchesSearch =
      influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesTier && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "활성", className: "bg-green-100 text-green-700" },
      pending: { label: "대기", className: "bg-yellow-100 text-yellow-700" },
      inactive: { label: "비활성", className: "bg-red-100 text-red-700" },
      suspended: { label: "정지", className: "bg-gray-100 text-gray-700" },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const getTierBadge = (tier: string) => {
    const tierMap = {
      premium: {
        label: "프리미엄",
        className: "bg-purple-100 text-purple-700",
      },
      gold: { label: "골드", className: "bg-yellow-100 text-yellow-700" },
      silver: { label: "실버", className: "bg-gray-100 text-gray-700" },
      bronze: { label: "브론즈", className: "bg-orange-100 text-orange-700" },
    };
    const tierInfo = tierMap[tier as keyof typeof tierMap];
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${tierInfo.className}`}
      >
        {tierInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">인플루언서 관리</h1>
          <p className="text-gray-600">
            등록된 인플루언서들을 관리하고 모니터링하세요
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
            일괄 승인
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 인플루언서</p>
              <p className="text-2xl font-bold text-gray-900">
                {influencers.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              👥
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">활성 인플루언서</p>
              <p className="text-2xl font-bold text-green-600">
                {influencers.filter((i) => i.status === "active").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              ✅
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 팔로워</p>
              <p className="text-2xl font-bold text-blue-600">
                {(
                  influencers.reduce((sum, i) => sum + i.followers, 0) / 1000
                ).toFixed(0)}
                K
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              📊
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 수익 지급</p>
              <p className="text-2xl font-bold text-purple-600">
                ₩
                {(
                  influencers.reduce((sum, i) => sum + i.totalEarnings, 0) /
                  1000000
                ).toFixed(0)}
                M
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === option.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {tiers.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Influencers List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  인플루언서
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  팔로워
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  참여율
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  완료 캠페인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평점
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수익
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInfluencers.map((influencer) => (
                <tr
                  key={influencer.id}
                  className="influencer-card hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src="https://images.unsplash.com/photo-1494790108755-2616c9c3e0e6?w=40&h=40&fit=crop&crop=face"
                        alt={influencer.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {influencer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {influencer.email}
                        </div>
                        <div className="flex space-x-1 mt-1">
                          {influencer.platforms.map((platform, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(influencer.status)}
                  </td>
                  <td className="px-6 py-4">{getTierBadge(influencer.tier)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(influencer.followers / 1000).toFixed(0)}K
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {influencer.engagement}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {influencer.completedCampaigns}개
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-1">
                        {"★".repeat(Math.floor(influencer.averageRating))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {influencer.averageRating}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ₩{(influencer.totalEarnings / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/influencers/${influencer.id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        상세보기
                      </Link>
                      <button className="text-gray-400 hover:text-gray-600 text-sm">
                        편집
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
