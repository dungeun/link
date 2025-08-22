"use client";

import { memo } from "react";
import Link from "next/link";
import { Campaign } from "@/types/campaign";

interface CategoryCampaignGridProps {
  campaigns: Campaign[];
  favorites: string[];
  onToggleFavorite: (campaignId: string) => void;
  t: (key: string, fallback?: string) => string;
}

const CategoryCampaignGrid = memo(function CategoryCampaignGrid({
  campaigns,
  favorites,
  onToggleFavorite,
  t,
}: CategoryCampaignGridProps) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
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

  const virtualImages = [
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=800&q=80",
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {campaigns.map((campaign, index) => {
        const imageIndex =
          campaign.id
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
          virtualImages.length;
        let imageUrl = campaign.image_url;

        if (
          !imageUrl ||
          imageUrl === "/images/campaigns/default.jpg" ||
          imageUrl === ""
        ) {
          imageUrl = virtualImages[imageIndex];
        }

        const daysLeft = Math.ceil(
          (new Date(campaign.application_deadline).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        return (
          <div
            key={campaign.id}
            className="group relative animate-in fade-in slide-in-from-bottom-4 duration-600 w-full"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Link href={`/campaigns/${campaign.id}`} className="block">
              <div className="relative aspect-square sm:aspect-[4/3] md:aspect-square mb-3 overflow-hidden rounded-xl bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                {/* 즐겨찾기 버튼 */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleFavorite(campaign.id);
                  }}
                  className="absolute top-3 right-3 z-10 w-10 h-10 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md active:scale-95"
                  aria-label="즐겨찾기"
                >
                  <svg
                    className={`w-5 h-5 transition-all duration-200 ${favorites.includes(campaign.id) ? "text-red-500 fill-current scale-110" : "text-gray-600"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                {/* 마감일 배지 */}
                {daysLeft <= 7 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs sm:text-sm font-bold px-3 py-2 rounded-full shadow-lg">
                    <span className="hidden sm:inline">마감임박 </span>
                    D-{daysLeft}
                  </div>
                )}

                {/* 이미지 */}
                <img
                  src={imageUrl}
                  alt={campaign.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src =
                      virtualImages[index % virtualImages.length];
                  }}
                />
              </div>

              {/* 정보 섹션 */}
              <div className="space-y-2 px-1">
                {/* 브랜드명 */}
                <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                  {campaign.brand_name}
                </p>

                {/* 제목 */}
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 group-hover:text-cyan-600 transition-colors leading-tight">
                  {campaign.title}
                </h3>

                {/* 카테고리 & 플랫폼 */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
                    {campaign.category}
                  </span>
                  <div className="flex gap-1">
                    {campaign.platforms?.slice(0, 2).map((platform: string) => (
                      <span key={platform} className="text-base">
                        {getPlatformIcon(platform)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 가격 정보 */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    ₩{(campaign.budget || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(
                      "campaigns.card.applicant_count",
                      "{count}명 지원",
                    ).replace("{count}", campaign.applicant_count.toString())}
                  </p>
                </div>

                {/* 추가 정보 */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    {t(
                      "campaigns.card.followers_required",
                      "팔로워 {count}+",
                    ).replace(
                      "{count}",
                      (campaign.required_followers || 0).toLocaleString(),
                    )}
                  </span>
                  <span>•</span>
                  <span>
                    {t("campaigns.card.days_left", "D-{days}").replace(
                      "{days}",
                      daysLeft.toString(),
                    )}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
});

export default CategoryCampaignGrid;
