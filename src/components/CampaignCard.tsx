import { memo } from "react";
import Image from "next/image";

interface Campaign {
  id: string;
  title: string;
  brand: string;
  applicants: number;
  maxApplicants: number;
  deadline: number;
  budget: string;
  campaignType?: string;
  reviewPrice?: number;
  imageUrl?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  index: number;
  onClick: (id: string) => void;
  t: (key: string, fallback?: string) => string;
}

const CampaignCard = memo(
  ({ campaign, index, onClick, t }: CampaignCardProps) => {
    return (
      <div
        onClick={() => onClick(campaign.id)}
        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer campaign-card"
        style={{ pointerEvents: "auto" }}
      >
        <div className="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 relative campaign-image">
          {campaign.imageUrl ? (
            <Image
              src={campaign.imageUrl}
              alt={campaign.title}
              fill
              className="object-cover"
              loading={index < 4 ? "eager" : "lazy"}
              quality={75}
              sizes="(max-width: 768px) 50vw, 25vw"
              unoptimized={campaign.imageUrl.includes(
                "blob.vercel-storage.com",
              )}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span className="bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
              {t("campaign.deadline", "D-{days}").replace(
                "{days}",
                campaign.deadline.toString(),
              )}
            </span>
            {campaign.campaignType === "REVIEW" && (
              <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                {t("campaign.review_type", "구매평")}
              </span>
            )}
          </div>
        </div>
        <div className="p-3 md:p-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">
            {campaign.brand}
          </p>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm md:text-base">
            {campaign.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-gray-500">
              {t("campaign.applicants_count", "{current}/{max}명")
                .replace("{current}", campaign.applicants.toString())
                .replace("{max}", campaign.maxApplicants.toString())}
            </span>
            <div className="text-right">
              {campaign.campaignType === "REVIEW" && campaign.reviewPrice ? (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">
                    {t("campaign.review_price_label", "구매평 단가")}
                  </span>
                  <span className="text-xs md:text-sm font-medium text-orange-600">
                    ₩{campaign.reviewPrice.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-xs md:text-sm font-medium text-blue-600">
                  {campaign.budget}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CampaignCard.displayName = "CampaignCard";

export default CampaignCard;
