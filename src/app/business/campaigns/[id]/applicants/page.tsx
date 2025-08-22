"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthService } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api/client";
import {
  ChevronLeft,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Instagram,
  Youtube,
  Globe,
} from "lucide-react";

interface Applicant {
  id: string;
  campaignId: string;
  influencerId: string;
  message: string;
  proposedPrice?: number;
  status: string;
  createdAt: string;
  influencer: {
    id: string;
    name: string;
    email: string;
    profile?: {
      profileImage?: string;
      instagram?: string;
      youtube?: string;
      naverBlog?: string;
      instagramFollowers?: number;
      youtubeSubscribers?: number;
      averageEngagementRate?: number;
    };
  };
}

export default function ApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<{
    id: string;
    title: string;
    description: string;
    status: string;
    budget: number;
  } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    // Middleware에서 이미 인증을 체크하므로 바로 데이터 로드
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 캠페인 정보 가져오기
      const campaignResponse = await apiGet(
        `/api/business/campaigns/${params.id}`,
      );
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();
        setCampaign(campaignData);
      }

      // 지원자 목록 가져오기
      const response = await apiGet(
        `/api/business/campaigns/${params.id}/applicants`,
      );
      if (response.ok) {
        const data = await response.json();
        setApplicants(data.applicants || []);
      }
    } catch (error) {
      console.error("데이터 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    applicantId: string,
    newStatus: "APPROVED" | "REJECTED",
  ) => {
    try {
      const response = await apiPost(
        `/api/business/campaigns/${params.id}/applicants/${applicantId}/status`,
        {
          status: newStatus,
        },
      );

      if (response.ok) {
        // 상태 업데이트 성공 시 목록 새로고침
        fetchData();
      } else {
        alert("상태 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("상태 업데이트 실패:", error);
      alert("상태 업데이트에 실패했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "검토중",
      },
      APPROVED: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        text: "승인됨",
      },
      REJECTED: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "거절됨",
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
      >
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const filteredApplicants =
    selectedStatus === "all"
      ? applicants
      : applicants.filter((app) => app.status === selectedStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href={`/business/campaigns/${params.id}`}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  지원자 관리
                </h1>
                {campaign && (
                  <p className="text-sm text-gray-600 mt-1">{campaign.title}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedStatus === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            전체 ({applicants.length})
          </button>
          <button
            onClick={() => setSelectedStatus("PENDING")}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedStatus === "PENDING"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            검토중 ({applicants.filter((a) => a.status === "PENDING").length})
          </button>
          <button
            onClick={() => setSelectedStatus("APPROVED")}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedStatus === "APPROVED"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            승인됨 ({applicants.filter((a) => a.status === "APPROVED").length})
          </button>
          <button
            onClick={() => setSelectedStatus("REJECTED")}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedStatus === "REJECTED"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            거절됨 ({applicants.filter((a) => a.status === "REJECTED").length})
          </button>
        </div>
      </div>

      {/* 지원자 목록 */}
      <div className="container mx-auto px-6 pb-8">
        {filteredApplicants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">지원자가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplicants.map((applicant) => (
              <div
                key={applicant.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  {/* 프로필 정보 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {applicant.influencer.profile?.profileImage ? (
                        <img
                          src={applicant.influencer.profile.profileImage}
                          alt={applicant.influencer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">
                          {applicant.influencer.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {applicant.influencer.email}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(applicant.status)}
                  </div>

                  {/* SNS 정보 */}
                  {applicant.influencer.profile && (
                    <div className="mb-4 space-y-2">
                      {applicant.influencer.profile.instagram && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Instagram className="w-4 h-4 mr-2" />
                          <span>
                            {applicant.influencer.profile.instagramFollowers?.toLocaleString() ||
                              0}{" "}
                            팔로워
                          </span>
                        </div>
                      )}
                      {applicant.influencer.profile.youtube && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Youtube className="w-4 h-4 mr-2" />
                          <span>
                            {applicant.influencer.profile.youtubeSubscribers?.toLocaleString() ||
                              0}{" "}
                            구독자
                          </span>
                        </div>
                      )}
                      {applicant.influencer.profile.averageEngagementRate && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Globe className="w-4 h-4 mr-2" />
                          <span>
                            평균 참여율{" "}
                            {applicant.influencer.profile.averageEngagementRate}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 지원 메시지 */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 flex items-start">
                      <MessageSquare className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-3">{applicant.message}</span>
                    </p>
                  </div>

                  {/* 제안 가격 */}
                  {applicant.proposedPrice && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        제안가: {formatCurrency(applicant.proposedPrice)}
                      </p>
                    </div>
                  )}

                  {/* 지원일 */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(applicant.createdAt)}
                    </p>
                  </div>

                  {/* 액션 버튼 */}
                  {applicant.status === "PENDING" && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleStatusUpdate(applicant.id, "APPROVED")
                        }
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        승인
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(applicant.id, "REJECTED")
                        }
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
