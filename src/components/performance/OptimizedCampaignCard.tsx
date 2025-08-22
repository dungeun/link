"use client";

import { memo, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

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
  budget: string;
  imageUrl?: string;
}

interface OptimizedCampaignCardProps {
  campaign: Campaign;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  t?: (key: string, fallback?: string) => string;
}

const OptimizedCampaignCard = memo(function OptimizedCampaignCard({
  campaign,
  isFavorite,
  onToggleFavorite,
  t,
}: OptimizedCampaignCardProps) {
  // 플랫폼 아이콘 메모이제이션
  const platformIcons = useMemo(() => {
    const iconMap: Record<string, string> = {
      instagram: "📷",
      youtube: "🎥",
      tiktok: "🎵",
      blog: "✍️",
    };

    return (
      campaign.platforms
        ?.slice(0, 2)
        .map((platform) => iconMap[platform] || "📱") || []
    );
  }, [campaign.platforms]);

  // 이벤트 핸들러 메모이제이션
  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleFavorite(campaign.id);
    },
    [campaign.id, onToggleFavorite],
  );

  // 진행률 계산 메모이제이션
  const progressData = useMemo(() => {
    const percentage = Math.min(
      (campaign.applicants / campaign.maxApplicants) * 100,
      100,
    );
    const isUrgent = campaign.deadline <= 3;
    const isAlmostFull = percentage >= 80;

    return {
      percentage,
      isUrgent,
      isAlmostFull,
      remainingSlots: campaign.maxApplicants - campaign.applicants,
    };
  }, [campaign.applicants, campaign.maxApplicants, campaign.deadline]);

  // 이미지 URL 처리 메모이제이션
  const optimizedImageUrl = useMemo(() => {
    if (
      !campaign.imageUrl ||
      campaign.imageUrl === "/images/campaigns/default.jpg"
    ) {
      // 가상 이미지 URL 생성
      const imageIndex =
        campaign.id
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6;
      const virtualImages = [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80",
        "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80",
        "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=400&q=80",
      ];
      return virtualImages[imageIndex];
    }
    return campaign.imageUrl;
  }, [campaign.id, campaign.imageUrl]);

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200">
        {/* 이미지 섹션 */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={optimizedImageUrl}
            alt={campaign.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="lazy"
            unoptimized={optimizedImageUrl.includes("blob.vercel-storage.com")}
          />

          {/* 즐겨찾기 버튼 */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm hover:shadow-md"
            aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            <svg
              className={`w-5 h-5 transition-all ${isFavorite ? "text-red-500 fill-current" : "text-gray-600"}`}
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

          {/* 긴급 배지 */}
          {progressData.isUrgent && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-lg">
              D-{campaign.deadline}
            </div>
          )}
        </div>

        {/* 콘텐츠 섹션 */}
        <div className="p-4 space-y-3">
          {/* 브랜드명과 카테고리 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              {campaign.brand}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {campaign.category}
            </span>
          </div>

          {/* 제목 */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {campaign.title}
          </h3>

          {/* 플랫폼 아이콘 */}
          <div className="flex items-center gap-1">
            {platformIcons.map((icon, index) => (
              <span key={index} className="text-lg">
                {icon}
              </span>
            ))}
          </div>

          {/* 예산 */}
          <div className="text-lg font-bold text-gray-900">
            {campaign.budget}
          </div>

          {/* 진행률 바 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {t?.("campaign.progress", "진행률") || "진행률"}
              </span>
              <span
                className={`font-medium ${progressData.isAlmostFull ? "text-orange-600" : "text-gray-900"}`}
              >
                {campaign.applicants}/{campaign.maxApplicants}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  progressData.isAlmostFull ? "bg-orange-500" : "bg-blue-500"
                }`}
                style={{ width: `${progressData.percentage}%` }}
              />
            </div>

            {progressData.remainingSlots <= 5 &&
              progressData.remainingSlots > 0 && (
                <p className="text-xs text-orange-600 font-medium">
                  {t?.(
                    "campaign.remaining_slots",
                    "남은 자리 {count}개",
                  ).replace(
                    "{count}",
                    progressData.remainingSlots.toString(),
                  ) || `남은 자리 ${progressData.remainingSlots}개`}
                </p>
              )}
          </div>
        </div>
      </div>
    </Link>
  );
});

export default OptimizedCampaignCard;
