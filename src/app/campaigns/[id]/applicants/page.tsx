"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  User,
  Star,
  Eye,
  MessageSquare,
  Instagram,
  Youtube,
  Calendar,
  MapPin,
  Award,
  TrendingUp,
  Clock,
  Users,
  Check,
  X,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Applicant {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  location: string;
  categories: string[];
  socialMedia: {
    instagram?: { handle: string; followers: number };
    youtube?: { handle: string; subscribers: number };
    tiktok?: { handle: string; followers: number };
  };
  stats: {
    completedCampaigns: number;
    averageRating: number;
    responseRate: number;
    engagementRate: number;
  };
  portfolio: {
    recentPosts: number;
    totalViews: number;
    avgLikes: number;
  };
  appliedDate: string;
  status: "pending" | "approved" | "rejected";
  coverLetter: string;
}

export default function CampaignApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [sortBy, setSortBy] = useState<
    "date" | "followers" | "rating" | "engagement"
  >("date");
  const [loading, setLoading] = useState(true);
  const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Mock 데이터
  const mockApplicants: Applicant[] = [
    {
      id: "1",
      name: "김뷰티",
      email: "kimbeauty@example.com",
      avatar: "/images/influencers/influencer1.jpg",
      bio: "뷰티 전문 인플루언서입니다. 트렌디한 메이크업과 스킨케어 리뷰를 전문으로 합니다.",
      location: "서울특별시",
      categories: ["beauty", "lifestyle"],
      socialMedia: {
        instagram: { handle: "kimbeauty_official", followers: 125000 },
        youtube: { handle: "KimBeautyChannel", subscribers: 45000 },
      },
      stats: {
        completedCampaigns: 23,
        averageRating: 4.8,
        responseRate: 95,
        engagementRate: 5.2,
      },
      portfolio: {
        recentPosts: 12,
        totalViews: 890000,
        avgLikes: 8500,
      },
      appliedDate: "2024-06-25",
      status: "pending",
      coverLetter:
        "안녕하세요! 뷰티 전문 인플루언서 김뷰티입니다. 귀하의 브랜드와 함께 일하고 싶어 지원하게 되었습니다. 제품의 장점을 솔직하게 전달하는 것이 제 강점입니다.",
    },
    {
      id: "2",
      name: "박라이프",
      email: "parklife@example.com",
      avatar: "/images/influencers/influencer2.jpg",
      bio: "일상 속 소소한 행복을 공유하는 라이프스타일 크리에이터입니다.",
      location: "경기도",
      categories: ["lifestyle", "travel"],
      socialMedia: {
        instagram: { handle: "park_daily_life", followers: 89000 },
        tiktok: { handle: "parklife_daily", followers: 156000 },
      },
      stats: {
        completedCampaigns: 18,
        averageRating: 4.6,
        responseRate: 88,
        engagementRate: 6.8,
      },
      portfolio: {
        recentPosts: 18,
        totalViews: 1200000,
        avgLikes: 12000,
      },
      appliedDate: "2024-06-24",
      status: "approved",
      coverLetter:
        "평소 귀하의 브랜드를 애용하고 있는 팬입니다. 제 일상 속에서 자연스럽게 제품을 소개할 수 있어 더욱 진정성 있는 콘텐츠 제작이 가능할 것 같습니다.",
    },
    {
      id: "3",
      name: "이패션",
      email: "leefashion@example.com",
      avatar: "/images/influencers/influencer3.jpg",
      bio: "트렌디한 패션 스타일링과 코디 팁을 공유합니다.",
      location: "부산광역시",
      categories: ["fashion", "beauty"],
      socialMedia: {
        instagram: { handle: "lee_fashion_style", followers: 67000 },
        youtube: { handle: "LeeFashionTV", subscribers: 23000 },
      },
      stats: {
        completedCampaigns: 15,
        averageRating: 4.4,
        responseRate: 82,
        engagementRate: 4.1,
      },
      portfolio: {
        recentPosts: 15,
        totalViews: 450000,
        avgLikes: 5600,
      },
      appliedDate: "2024-06-23",
      status: "pending",
      coverLetter:
        "패션과 뷰티를 결합한 콘텐츠로 많은 사랑을 받고 있습니다. 브랜드의 가치와 제품의 특징을 잘 표현할 수 있는 크리에이터입니다.",
    },
  ];

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        // 캠페인 정보 가져오기
        const response = await fetch(
          `/api/campaigns/${params.id}/applications`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          // API 응답을 현재 UI 형식에 맞게 변환
          const formattedApplicants = data.applications.map((app: any) => ({
            id: app.id,
            name: app.influencer?.name || "",
            email: app.influencer?.email || "",
            avatar:
              app.influencer?.profile?.profileImage ||
              "/images/default-avatar.png",
            bio: app.influencer?.profile?.bio || "",
            location: app.influencer?.profile?.location || "전국",
            categories: app.influencer?.profile?.categories || [],
            socialMedia: {
              instagram: app.influencer?.profile?.instagramHandle
                ? {
                    handle: app.influencer.profile.instagramHandle,
                    followers: app.influencer.profile.instagramFollowers || 0,
                  }
                : null,
              youtube: app.influencer?.profile?.youtubeHandle
                ? {
                    handle: app.influencer.profile.youtubeHandle,
                    subscribers: app.influencer.profile.youtubeSubscribers || 0,
                  }
                : null,
              tiktok: app.influencer?.profile?.tiktokHandle
                ? {
                    handle: app.influencer.profile.tiktokHandle,
                    followers: app.influencer.profile.tiktokFollowers || 0,
                  }
                : null,
            },
            stats: {
              completedCampaigns: app.influencer._count?.applications || 0,
              averageRating: 4.5,
              responseRate: 90,
              engagementRate: 5.2,
            },
            portfolio: {
              recentPosts: 0,
              totalViews: 0,
              avgLikes: 0,
            },
            appliedDate: app.createdAt,
            status: app.status.toLowerCase(),
            coverLetter: app.message || "",
          }));

          setApplicants(formattedApplicants);
          setFilteredApplicants(formattedApplicants);
        } else {
          // 에러 처리 - mock 데이터 사용
          console.error("Failed to fetch applicants, using mock data");
          setApplicants(mockApplicants);
          setFilteredApplicants(mockApplicants);
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
        // 에러 시 mock 데이터 사용
        setApplicants(mockApplicants);
        setFilteredApplicants(mockApplicants);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [params.id]);

  useEffect(() => {
    filterAndSortApplicants();
  }, [searchTerm, statusFilter, sortBy, applicants]);

  const filterAndSortApplicants = () => {
    let filtered = [...applicants];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (applicant) =>
          applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          applicant.bio.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (applicant) => applicant.status === statusFilter,
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "followers":
          const aFollowers = a.socialMedia.instagram?.followers || 0;
          const bFollowers = b.socialMedia.instagram?.followers || 0;
          return bFollowers - aFollowers;
        case "rating":
          return b.stats.averageRating - a.stats.averageRating;
        case "engagement":
          return b.stats.engagementRate - a.stats.engagementRate;
        case "date":
        default:
          return (
            new Date(b.appliedDate).getTime() -
            new Date(a.appliedDate).getTime()
          );
      }
    });

    setFilteredApplicants(filtered);
  };

  const handleApplicantAction = async (
    applicantId: string,
    action: "approve" | "reject",
  ) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/business/applications/${applicantId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: action === "approve" ? "approved" : "rejected",
          }),
        },
      );

      if (response.ok) {
        // 성공하면 로컬 상태 업데이트
        setApplicants((prev) =>
          prev.map((applicant) =>
            applicant.id === applicantId
              ? {
                  ...applicant,
                  status: action === "approve" ? "approved" : "rejected",
                }
              : applicant,
          ),
        );
        alert(`지원자가 ${action === "approve" ? "승인" : "거절"}되었습니다.`);
      } else {
        const error = await response.json();
        alert(error.error || "상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    try {
      const token = localStorage.getItem("accessToken");

      // 각 선택된 지원자에 대해 API 호출
      const promises = selectedApplicants.map((applicantId) =>
        fetch(`/api/business/applications/${applicantId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: action === "approve" ? "approved" : "rejected",
          }),
        }),
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;

      if (successCount > 0) {
        // 성공한 것들만 로컬 상태 업데이트
        setApplicants((prev) =>
          prev.map((applicant) =>
            selectedApplicants.includes(applicant.id)
              ? {
                  ...applicant,
                  status: action === "approve" ? "approved" : "rejected",
                }
              : applicant,
          ),
        );
        alert(
          `${successCount}명의 지원자가 ${action === "approve" ? "승인" : "거절"}되었습니다.`,
        );
      }

      if (successCount < selectedApplicants.length) {
        alert(
          `${selectedApplicants.length - successCount}명의 상태 변경에 실패했습니다.`,
        );
      }

      setSelectedApplicants([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error("일괄 처리 오류:", error);
      alert("일괄 처리 중 오류가 발생했습니다.");
    }
  };

  const toggleApplicantSelection = (applicantId: string) => {
    setSelectedApplicants((prev) =>
      prev.includes(applicantId)
        ? prev.filter((id) => id !== applicantId)
        : [...prev, applicantId],
    );
  };

  const selectAllApplicants = () => {
    const pendingApplicants = filteredApplicants
      .filter((applicant) => applicant.status === "pending")
      .map((applicant) => applicant.id);
    setSelectedApplicants(pendingApplicants);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 페이지 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  캠페인 지원자 관리
                </h1>
                <p className="text-sm text-gray-600">
                  지원자를 검토하고 승인/거절을 결정하세요
                </p>
              </div>
            </div>
            {selectedApplicants.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {selectedApplicants.length}명 선택됨
                </span>
                <button
                  onClick={() => handleBulkAction("approve")}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  일괄 승인
                </button>
                <button
                  onClick={() => handleBulkAction("reject")}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  일괄 거절
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="인플루언서 이름, 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 필터 */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as
                      | "all"
                      | "pending"
                      | "approved"
                      | "rejected",
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 상태</option>
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "date"
                      | "followers"
                      | "rating"
                      | "engagement",
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">지원일순</option>
                <option value="followers">팔로워순</option>
                <option value="rating">평점순</option>
                <option value="engagement">참여율순</option>
              </select>

              <button
                onClick={selectAllApplicants}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                전체 선택
              </button>
            </div>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t text-sm text-gray-600">
            <span>전체: {filteredApplicants.length}명</span>
            <span>
              대기중:{" "}
              {filteredApplicants.filter((a) => a.status === "pending").length}
              명
            </span>
            <span>
              승인됨:{" "}
              {filteredApplicants.filter((a) => a.status === "approved").length}
              명
            </span>
            <span>
              거절됨:{" "}
              {filteredApplicants.filter((a) => a.status === "rejected").length}
              명
            </span>
          </div>
        </div>

        {/* 지원자 목록 */}
        <div className="space-y-4">
          {filteredApplicants.map((applicant) => (
            <div
              key={applicant.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* 체크박스 */}
                  {applicant.status === "pending" && (
                    <input
                      type="checkbox"
                      checked={selectedApplicants.includes(applicant.id)}
                      onChange={() => toggleApplicantSelection(applicant.id)}
                      className="mt-6 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  )}

                  {/* 프로필 이미지 */}
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>

                  {/* 기본 정보 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {applicant.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          {applicant.location}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {applicant.categories.map((category) => (
                            <span
                              key={category}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 상태 및 액션 */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            applicant.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : applicant.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {applicant.status === "pending"
                            ? "대기중"
                            : applicant.status === "approved"
                              ? "승인됨"
                              : "거절됨"}
                        </span>

                        {applicant.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleApplicantAction(applicant.id, "approve")
                              }
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleApplicantAction(applicant.id, "reject")
                              }
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 소셜 미디어 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {applicant.socialMedia.instagram && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Instagram className="h-5 w-5 text-pink-600" />
                          <div>
                            <p className="font-medium text-sm">
                              @{applicant.socialMedia.instagram.handle}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatNumber(
                                applicant.socialMedia.instagram.followers,
                              )}{" "}
                              팔로워
                            </p>
                          </div>
                        </div>
                      )}
                      {applicant.socialMedia.youtube && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Youtube className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium text-sm">
                              {applicant.socialMedia.youtube.handle}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatNumber(
                                applicant.socialMedia.youtube.subscribers,
                              )}{" "}
                              구독자
                            </p>
                          </div>
                        </div>
                      )}
                      {applicant.socialMedia.tiktok && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-5 h-5 bg-black rounded-full"></div>
                          <div>
                            <p className="font-medium text-sm">
                              @{applicant.socialMedia.tiktok.handle}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatNumber(
                                applicant.socialMedia.tiktok.followers,
                              )}{" "}
                              팔로워
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 통계 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">
                          {applicant.stats.completedCampaigns}
                        </p>
                        <p className="text-xs text-gray-600">완료 캠페인</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {applicant.stats.averageRating}
                        </p>
                        <p className="text-xs text-gray-600">평균 평점</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">
                          {applicant.stats.responseRate}%
                        </p>
                        <p className="text-xs text-gray-600">응답률</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-900">
                          {applicant.stats.engagementRate}%
                        </p>
                        <p className="text-xs text-gray-600">참여율</p>
                      </div>
                    </div>

                    {/* 자기소개서 */}
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        지원 메시지
                      </h4>
                      <p className="text-sm text-gray-700">
                        {applicant.coverLetter}
                      </p>
                    </div>

                    {/* 연락처 및 액션 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          지원일:{" "}
                          {new Date(applicant.appliedDate).toLocaleDateString(
                            "ko-KR",
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {applicant.email}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-sm">
                          프로필 보기
                        </button>
                        <button className="px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                          메시지 보내기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {filteredApplicants.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              지원자가 없습니다
            </h3>
            <p className="text-gray-600">
              아직 이 캠페인에 지원한 인플루언서가 없습니다.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
