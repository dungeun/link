"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo, memo } from "react";

interface Campaign {
  id: string;
  title: string;
  brand: string;
  applicants: number;
  maxApplicants: number;
  deadline: number;
  category: string;
  platforms: string[];
  description: string;
  createdAt: string;
  budget: string;
  imageUrl?: string;
  isRecommended?: boolean;
  recommendedReason?: string;
}

interface SectionSettings {
  count?: number;
  algorithm?: string;
}

interface Section {
  title?: string;
  subtitle?: string;
  settings?: SectionSettings;
}

interface LocalizedContent {
  title?: string;
  subtitle?: string;
}

interface RecommendedSectionProps {
  section: Section;
  localizedContent: LocalizedContent;
  t: (key: string, fallback?: string) => string;
}

function RecommendedSection({
  section,
  localizedContent,
  t,
}: RecommendedSectionProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // 섹션 설정에서 개수와 알고리즘 가져오기 - 메모이제이션
  const count = useMemo(
    () => section.settings?.count || 4,
    [section.settings?.count],
  );
  const algorithm = useMemo(
    () => section.settings?.algorithm || "personalized",
    [section.settings?.algorithm],
  );

  // 제목과 부제목 (다국어 지원) - 메모이제이션
  const title = useMemo(
    () => localizedContent?.title || section.title || "추천 캠페인",
    [localizedContent?.title, section.title],
  );
  const subtitle = useMemo(
    () =>
      localizedContent?.subtitle || section.subtitle || "당신을 위한 맞춤 추천",
    [localizedContent?.subtitle, section.subtitle],
  );

  // 추천 이유 생성 - 메모이제이션
  const getRecommendedReason = useCallback(
    (campaign: Campaign, algo: string) => {
      switch (algo) {
        case "personalized":
          return "관심 카테고리 기반 추천";
        case "trending":
          return "인기 급상승 캠페인";
        case "new":
          return "새로운 캠페인";
        default:
          return "맞춤 추천";
      }
    },
    [],
  );

  // 추천 뱃지 아이콘 - 메모이제이션
  const getRecommendedIcon = useCallback((reason?: string) => {
    if (reason?.includes("관심")) return "🎯";
    if (reason?.includes("급상승")) return "🔥";
    if (reason?.includes("새로운")) return "✨";
    return "💎";
  }, []);

  const loadRecommendedCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      // 추천 알고리즘에 따라 API 호출
      const algoParam =
        algorithm === "personalized"
          ? "recommended"
          : algorithm === "trending"
            ? "trending"
            : algorithm === "new"
              ? "latest"
              : "recommended";

      const response = await fetch(
        `/api/campaigns?status=active&limit=${count}&type=${algoParam}&recommended=true`,
      );
      const data = await response.json();

      if (data.campaigns) {
        // 추천 이유 추가
        const recommendedCampaigns = data.campaigns.map(
          (campaign: Campaign) => ({
            ...campaign,
            isRecommended: true,
            recommendedReason: getRecommendedReason(campaign, algorithm),
          }),
        );
        setCampaigns(recommendedCampaigns);
      }
    } catch (error) {
      console.error("Failed to load recommended campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, [algorithm, count, getRecommendedReason]);

  useEffect(() => {
    loadRecommendedCampaigns();
  }, [loadRecommendedCampaigns]);

  return (
    <div className="mb-12">
      {/* 섹션 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {title}
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">{subtitle}</p>
        </div>
        <Link
          href="/campaigns?recommended=true"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm md:text-base"
        >
          전체보기 →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(count)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-80 animate-pulse"
            />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative group cursor-pointer"
              style={{ pointerEvents: "auto" }}
            >
              {/* 추천 뱃지 */}
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <span>{getRecommendedIcon(campaign.recommendedReason)}</span>
                  <span className="hidden md:inline">추천</span>
                </div>
              </div>

              {/* 캠페인 이미지 */}
              <div className="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
                {campaign.imageUrl && (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <span className="bg-white/90 backdrop-blur px-1.5 py-0.5 rounded text-xs font-medium">
                    D-{campaign.deadline}
                  </span>
                </div>

                {/* 그라데이션 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* 캠페인 정보 */}
              <div className="p-2 md:p-4">
                {/* 추천 이유 - 모바일에서는 더 작게 */}
                <div className="mb-2">
                  <span className="text-xs text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded leading-tight">
                    {campaign.recommendedReason}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-1 truncate">
                  {campaign.brand}
                </p>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-xs md:text-sm leading-tight">
                  {campaign.title}
                </h3>

                {/* 캠페인 설명 - 모바일에서는 숨김 */}
                <p className="hidden md:block text-sm text-gray-600 mb-3 line-clamp-2">
                  {campaign.description}
                </p>

                {/* 플랫폼 태그 - 모바일에서는 최대 2개만 */}
                {campaign.platforms && campaign.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {campaign.platforms.slice(0, 2).map((platform, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
                      >
                        {platform}
                      </span>
                    ))}
                    {campaign.platforms.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{campaign.platforms.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* 통계 정보 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {campaign.applicants}/{campaign.maxApplicants}명
                    </span>
                    <span className="text-xs font-medium text-blue-600">
                      {campaign.budget}
                    </span>
                  </div>

                  {/* 진행률 표시 */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((campaign.applicants / campaign.maxApplicants) * 100, 100)}%`,
                      }}
                    />
                  </div>

                  <div className="hidden md:block text-xs text-gray-500">
                    진행률{" "}
                    {Math.round(
                      (campaign.applicants / campaign.maxApplicants) * 100,
                    )}
                    %
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500">추천할 캠페인이 없습니다.</p>
        </div>
      )}

      {/* 추천 알고리즘 설명 */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          {algorithm === "personalized" && "사용자 관심사 기반 개인화 추천"}
          {algorithm === "trending" && "최근 인기 급상승 캠페인 추천"}
          {algorithm === "new" && "새롭게 등록된 캠페인 추천"}
          {algorithm === "collaborative" &&
            "유사한 사용자들이 관심을 가진 캠페인"}
        </p>
      </div>
    </div>
  );
}

// React.memo로 성능 최적화
export default memo(RecommendedSection);
