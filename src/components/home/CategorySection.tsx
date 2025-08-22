"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo, memo } from "react";

interface Campaign {
  id: string;
  title: string;
  brand: string;
  brand_name?: string;
  applicants: number;
  maxApplicants: number;
  deadline: number;
  category: string;
  categoryName?: string;
  platforms: string[];
  description: string;
  createdAt: string;
  budget: string;
  imageUrl?: string;
  image_url?: string;
  required_followers?: number;
  applicant_count?: number;
}

interface SectionSettings {
  count?: number;
  categorySlug?: string;
  categoryName?: string;
}

interface Section {
  title?: string;
  subtitle?: string;
  settings?: SectionSettings;
}

interface CategoryMenu {
  id: string;
  name: string;
  link: string;
  icon?: string;
  iconType?: "emoji" | "lucide";
  badge?: string;
  badgeColor?: string;
  visible: boolean;
  order: number;
}

interface LocalizedContent {
  title?: string;
  subtitle?: string;
  categories?: CategoryMenu[];
  gridLayout?: string;
}

interface CategorySectionProps {
  section: Section;
  localizedContent: LocalizedContent;
  t: (key: string, fallback?: string) => string;
}

function CategorySection({
  section,
  localizedContent,
  t,
}: CategorySectionProps) {
  // ALL HOOKS MUST BE DECLARED AT THE TOP - NEVER CONDITIONALLY!
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // 섹션 설정에서 카테고리 정보 가져오기
  const count = useMemo(
    () => section.settings?.count || 8,
    [section.settings?.count],
  );
  const categorySlug = useMemo(
    () => section.settings?.categorySlug || "hospital",
    [section.settings?.categorySlug],
  );
  const categoryName = useMemo(
    () => section.settings?.categoryName || "병원",
    [section.settings?.categoryName],
  );

  // 제목과 부제목 (다국어 지원)
  const translatedCategoryName = useMemo(
    () => t(`category.${categorySlug}`, categoryName),
    [categorySlug, categoryName, t],
  );
  const title = useMemo(
    () =>
      localizedContent?.title ||
      section.title ||
      t("category.campaigns_title", "{category} 캠페인").replace(
        "{category}",
        translatedCategoryName,
      ),
    [localizedContent?.title, section.title, translatedCategoryName, t],
  );
  const subtitle = useMemo(
    () =>
      localizedContent?.subtitle ||
      section.subtitle ||
      t(
        "category.campaigns_subtitle",
        "{category} 관련 캠페인을 만나보세요",
      ).replace("{category}", translatedCategoryName),
    [localizedContent?.subtitle, section.subtitle, translatedCategoryName, t],
  );

  const loadCategoryCampaigns = useCallback(async () => {
    try {
      setLoading(true);

      // 카테고리별 캠페인 조회
      const response = await fetch(
        `/api/campaigns/simple?category=${categorySlug}&limit=${count}&status=active`,
      );
      const data = await response.json();

      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error(`Failed to load ${categorySlug} campaigns:`, error);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, count]);

  useEffect(() => {
    // 카테고리 메뉴가 있는 경우에는 캠페인을 로드하지 않음
    if (
      !localizedContent?.categories ||
      localizedContent.categories.length === 0
    ) {
      loadCategoryCampaigns();
    }
  }, [loadCategoryCampaigns, localizedContent?.categories]);

  // 디버깅 로그 추가
  console.log("[CategorySection] Received props:", {
    section,
    localizedContent,
    hasCategories: localizedContent?.categories,
  });

  // admin에서 설정한 카테고리 메뉴가 있으면 그것을 표시
  if (localizedContent?.categories && localizedContent.categories.length > 0) {
    // 카테고리 메뉴 아이콘 섹션 렌더링
    const visibleCategories = localizedContent.categories
      .filter((cat) => cat.visible)
      .sort((a, b) => a.order - b.order);

    const getBadgeColorClass = (color?: string) => {
      const colorMap: { [key: string]: string } = {
        red: "bg-red-500",
        blue: "bg-blue-500",
        green: "bg-green-500",
        purple: "bg-purple-500",
        orange: "bg-orange-500",
        yellow: "bg-yellow-500",
        pink: "bg-pink-500",
      };
      return colorMap[color || ""] || "bg-gray-500";
    };

    return (
      <div className="mb-12">
        <div className="bg-white rounded-xl p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {visibleCategories.map((category) => (
              <Link
                key={category.id}
                href={category.link}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="relative">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100 group-hover:shadow-md group-hover:border-blue-200 transition-all">
                    {category.iconType === "emoji" ? (
                      <span className="text-2xl">{category.icon}</span>
                    ) : (
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    )}
                  </div>
                  {category.badge && (
                    <span
                      className={`absolute -top-1 -right-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${getBadgeColorClass(
                        category.badgeColor,
                      )}`}
                    >
                      {category.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-700 text-center">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 플랫폼 아이콘
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return "📷";
      case "youtube":
        return "🎥";
      case "tiktok":
        return "🎵";
      case "blog":
        return "✍️";
      default:
        return "📱";
    }
  };

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
          href={`/category/${categorySlug}`}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm md:text-base"
        >
          {t("common.view_all", "전체보기")} →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(count)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-64 animate-pulse"
            />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {campaigns.map((campaign) => {
            const imageUrl =
              campaign.image_url ||
              campaign.imageUrl ||
              "/images/campaigns/default.jpg";
            const brandName =
              campaign.brand_name || campaign.brand || "Unknown";
            const applicantCount =
              campaign.applicant_count || campaign.applicants || 0;
            const requiredFollowers = campaign.required_followers || 0;

            return (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative group cursor-pointer"
                style={{ pointerEvents: "auto" }}
              >
                {/* 카테고리 뱃지 */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium">
                    {t(
                      `category.${campaign.category.replace(/-/g, "_")}`,
                      campaign.categoryName || categoryName,
                    )}
                  </div>
                </div>

                {/* 마감일 뱃지 */}
                {campaign.deadline <= 7 && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      D-{campaign.deadline}
                    </div>
                  </div>
                )}

                {/* 캠페인 이미지 */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={campaign.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/images/campaigns/default.jpg";
                    }}
                  />
                </div>

                {/* 캠페인 정보 */}
                <div className="p-3 md:p-4">
                  <p className="text-xs text-gray-500 mb-1">{brandName}</p>
                  <h3 className="font-medium text-sm md:text-base text-gray-900 line-clamp-2 mb-2">
                    {campaign.title}
                  </h3>

                  {/* 플랫폼 & 통계 */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex gap-1">
                      {campaign.platforms
                        ?.slice(0, 2)
                        .map((platform: string) => (
                          <span key={platform}>
                            {getPlatformIcon(platform)}
                          </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {requiredFollowers > 0 && (
                        <span>{requiredFollowers.toLocaleString()}+</span>
                      )}
                      <span>
                        {t(
                          "campaign.applicants_applied",
                          "{count}명 지원",
                        ).replace("{count}", applicantCount.toString())}
                      </span>
                    </div>
                  </div>

                  {/* 예산 */}
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm md:text-base font-bold text-gray-900">
                      ₩{parseInt(campaign.budget).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">
            {t(
              "category.no_campaigns",
              "{category} 캠페인이 없습니다.",
            ).replace("{category}", translatedCategoryName)}
          </p>
          <Link
            href="/campaigns"
            className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            {t("campaign.view_all_campaigns", "전체 캠페인 보기")}
          </Link>
        </div>
      )}
    </div>
  );
}

export default memo(CategorySection);
