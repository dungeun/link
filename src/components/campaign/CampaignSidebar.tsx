"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Heart,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Edit,
  FileText,
} from "lucide-react";

interface Campaign {
  id: string;
  status: string;
  budget: number | { amount: number; type: string; currency: string };
  budgetType?: string;
  maxApplicants: number;
  targetFollowers: number;
  startDate: string;
  endDate: string;
  applicationStartDate?: string | null;
  applicationEndDate?: string | null;
  contentStartDate?: string | null;
  contentEndDate?: string | null;
  resultAnnouncementDate?: string | null;
  announcementDate?: string | null;
  hasApplied?: boolean;
  applicationStatus?: string;
  business?: {
    id: string;
  };
  _count: {
    applications: number;
    likes: number;
  };
  target?: {
    followers?: {
      min?: number;
    };
    maxApplicants?: number;
  };
  schedule?: {
    application?: {
      startDate?: string;
      endDate?: string;
    };
    campaign?: {
      startDate?: string;
      endDate?: string;
    };
    content?: {
      startDate?: string;
      endDate?: string;
    };
    announcement?: {
      date?: string;
      resultDate?: string;
    };
  };
}

interface User {
  id: string;
  type: string;
}

interface CampaignSidebarProps {
  campaign: Campaign;
  user: User | null;
  isLiked: boolean;
  likeCount: number;
  daysLeft: number;
  applicationProgress: number;
  applicationHasStarted: boolean;
  isApplicationPeriodActive: boolean;
  onApplyClick: () => void;
  onLikeClick: () => void;
}

export default function CampaignSidebar({
  campaign,
  user,
  isLiked,
  likeCount,
  daysLeft,
  applicationProgress,
  applicationHasStarted,
  isApplicationPeriodActive,
  onApplyClick,
  onLikeClick,
}: CampaignSidebarProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || dateString === "null" || dateString === "undefined") {
      return "미정";
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "미정";
    }

    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
      <h3 className="font-semibold text-gray-900 mb-4">캠페인 정보</h3>

      <div className="space-y-4">
        {/* 예산 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />총 예산
          </span>
          <div className="text-right">
            <span className="font-semibold">
              ₩
              {(() => {
                const budget = campaign.budget;
                if (typeof budget === "number") {
                  return budget.toLocaleString();
                } else if (
                  budget &&
                  typeof budget === "object" &&
                  budget.amount
                ) {
                  return budget.amount.toLocaleString();
                }
                return "0";
              })()}
            </span>
            <div className="text-xs text-gray-500">
              {campaign.budgetType === "FREE" && "무료 캠페인"}
              {campaign.budgetType === "PAID" && "유료 캠페인"}
              {campaign.budgetType === "REVIEW" && "구매평 캠페인"}
              {!campaign.budgetType && "무료 캠페인"}
            </div>
          </div>
        </div>

        {/* 모집 인원 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              모집 현황
            </span>
            <span className="font-semibold">
              {campaign._count?.applications || 0}/
              {campaign.target?.maxApplicants || campaign.maxApplicants || 0}명
            </span>
          </div>
          <Progress value={applicationProgress} className="h-2" />
        </div>

        {/* 팔로워 요구사항 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            최소 팔로워
          </span>
          <span className="font-semibold">
            {(
              campaign.target?.followers?.min ||
              campaign.targetFollowers ||
              0
            ).toLocaleString()}
            명
          </span>
        </div>

        {/* 캠페인 기간 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            캠페인 기간
          </span>
          <span className="font-semibold text-sm">
            {(() => {
              const startDate =
                campaign.schedule?.campaign?.startDate || campaign.startDate;
              const endDate =
                campaign.schedule?.campaign?.endDate || campaign.endDate;
              return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
            })()}
          </span>
        </div>

        {/* 신청 기간 */}
        {(() => {
          // 새로운 정규화된 구조 우선 확인, 없으면 기존 구조 사용
          const startDate =
            campaign.schedule?.application?.startDate ||
            campaign.applicationStartDate;
          const endDate =
            campaign.schedule?.application?.endDate ||
            campaign.applicationEndDate;

          return (
            (startDate || endDate) && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  신청 기간
                </span>
                <span className="font-semibold text-sm">
                  {formatDate(startDate)} ~ {formatDate(endDate)}
                </span>
              </div>
            )
          );
        })()}

        {/* 인플루언서 발표 */}
        {(() => {
          const announcementDate =
            campaign.schedule?.announcement?.date || campaign.announcementDate;
          return (
            announcementDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  인플루언서 발표
                </span>
                <span className="font-semibold text-sm">
                  {formatDate(announcementDate)}
                </span>
              </div>
            )
          );
        })()}

        {/* 콘텐츠 등록 기간 */}
        {(() => {
          const contentStartDate =
            campaign.schedule?.content?.startDate || campaign.contentStartDate;
          const contentEndDate =
            campaign.schedule?.content?.endDate || campaign.contentEndDate;
          return (
            (contentStartDate || contentEndDate) && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  콘텐츠 등록
                </span>
                <span className="font-semibold text-sm">
                  {formatDate(contentStartDate)} ~ {formatDate(contentEndDate)}
                </span>
              </div>
            )
          );
        })()}

        {/* 결과 발표 */}
        {(() => {
          const resultDate =
            campaign.schedule?.announcement?.resultDate ||
            campaign.resultAnnouncementDate;
          return (
            resultDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  결과 발표
                </span>
                <span className="font-semibold text-sm">
                  {formatDate(resultDate)}
                </span>
              </div>
            )
          );
        })()}

        {/* 남은 기간 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {campaign.applicationEndDate ? "신청 마감까지" : "마감까지"}
          </span>
          <span
            className={`font-semibold ${daysLeft <= 3 ? "text-red-600" : ""}`}
          >
            {!applicationHasStarted
              ? "신청 대기중"
              : daysLeft > 0
                ? `${daysLeft}일 남음`
                : "마감됨"}
          </span>
        </div>

        {/* 좋아요 수 */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            관심
          </span>
          <span className="font-semibold">{likeCount}명</span>
        </div>
      </div>

      {/* 지원 버튼 */}
      <div className="mt-6 space-y-3">
        {user?.type === "INFLUENCER" && (
          <>
            {campaign.hasApplied === true ? (
              <div className="text-center">
                <Badge className="bg-green-100 text-green-800">
                  {campaign.applicationStatus === "PENDING" &&
                    "지원 완료 (검토 중)"}
                  {campaign.applicationStatus === "APPROVED" && "승인됨"}
                  {campaign.applicationStatus === "REJECTED" && "거절됨"}
                  {!campaign.applicationStatus && "상태 확인 중..."}
                </Badge>
              </div>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={onApplyClick}
                disabled={
                  campaign.status !== "ACTIVE" ||
                  !isApplicationPeriodActive ||
                  (campaign._count?.applications || 0) >=
                    (campaign.target?.maxApplicants ||
                      campaign.maxApplicants ||
                      0)
                }
              >
                {campaign.status !== "ACTIVE"
                  ? "캠페인 종료됨"
                  : !applicationHasStarted
                    ? "신청 대기중"
                    : !isApplicationPeriodActive
                      ? "모집 마감됨"
                      : (campaign._count?.applications || 0) >=
                          (campaign.target?.maxApplicants ||
                            campaign.maxApplicants ||
                            0)
                        ? "모집 완료됨"
                        : "캠페인 지원하기"}
              </Button>
            )}
          </>
        )}

        {user?.type === "BUSINESS" &&
          campaign.business &&
          user?.id === campaign.business.id && (
            <>
              <Link
                href={`/business/campaigns/${campaign.id}/edit`}
                className="block w-full"
              >
                <Button className="w-full" size="lg">
                  <Edit className="w-4 h-4 mr-2" />
                  캠페인 수정
                </Button>
              </Link>
              <Link
                href={`/business/campaigns/${campaign.id}/applicants`}
                className="block w-full"
              >
                <Button variant="outline" className="w-full" size="lg">
                  <Users className="w-4 h-4 mr-2" />
                  지원자 관리 ({campaign._count?.applications || 0}명)
                </Button>
              </Link>
            </>
          )}

        {user?.type === "INFLUENCER" && (
          <Button variant="outline" className="w-full" onClick={onLikeClick}>
            <Heart
              className={`w-4 h-4 mr-2 ${isLiked ? "fill-current text-red-500" : ""}`}
            />
            {isLiked ? "관심 캠페인 제거" : "관심 캠페인 추가"}
          </Button>
        )}
      </div>

      {/* 주의사항 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900 mb-2">주의사항</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 허위 정보 작성 시 불이익이 있을 수 있습니다.</li>
              <li>• 캠페인 승인 후 취소 시 패널티가 부과됩니다.</li>
              <li>• 콘텐츠 제작 가이드라인을 반드시 준수해주세요.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
