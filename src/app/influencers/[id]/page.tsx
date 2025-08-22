"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function InfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("portfolio");
  const [showContactModal, setShowContactModal] = useState(false);

  // Mock influencer data
  const influencer = {
    id: params.id,
    name: "뷰티크리에이터A",
    handle: "@beauty_creator_a",
    category: "beauty",
    followers: "125.3K",
    engagement: "4.8%",
    platforms: ["instagram", "youtube"],
    specialties: ["메이크업", "스킨케어", "뷰티리뷰"],
    bio: "10년차 메이크업 아티스트 출신 뷰티 크리에이터입니다. 진정성 있는 리뷰와 실용적인 뷰티 팁을 공유합니다.",
    avgViews: "15K",
    completedCampaigns: 45,
    rating: 4.9,
    location: "서울, 대한민국",
    languages: ["한국어", "영어"],
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616c9c3e0e6?w=200&h=200&fit=crop&crop=face",
    stats: {
      totalReach: "2.5M",
      avgLikes: "8.2K",
      avgComments: "342",
      avgShares: "156",
    },
    demographics: {
      gender: { female: 85, male: 15 },
      age: {
        "13-17": 5,
        "18-24": 35,
        "25-34": 45,
        "35-44": 12,
        "45+": 3,
      },
      topLocations: ["서울 45%", "경기도 20%", "부산 8%", "인천 5%"],
    },
    portfolio: [
      {
        id: 1,
        type: "instagram",
        thumbnail:
          "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?w=300&h=300&fit=crop",
        title: "여름 메이크업 튜토리얼",
        likes: "12.5K",
        comments: "453",
      },
      {
        id: 2,
        type: "youtube",
        thumbnail:
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=200&fit=crop",
        title: "신제품 언박싱 & 리뷰",
        views: "45.2K",
        likes: "2.1K",
      },
      {
        id: 3,
        type: "instagram",
        thumbnail:
          "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?w=300&h=300&fit=crop",
        title: "데일리 스킨케어 루틴",
        likes: "9.8K",
        comments: "287",
      },
      {
        id: 4,
        type: "instagram",
        thumbnail:
          "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?w=300&h=300&fit=crop",
        title: "가을 립 컬렉션",
        likes: "15.3K",
        comments: "512",
      },
    ],
    reviews: [
      {
        id: 1,
        brand: "클린뷰티 브랜드 A",
        rating: 5,
        comment:
          "정말 전문적이고 친절한 인플루언서입니다. 콘텐츠 퀄리티가 뛰어나고 소통도 원활했습니다.",
        date: "2025-05-15",
      },
      {
        id: 2,
        brand: "코스메틱 브랜드 B",
        rating: 5,
        comment:
          "약속된 일정을 잘 지키고, 브랜드 가이드라인을 완벽하게 이해하고 작업해주셨습니다.",
        date: "2025-04-20",
      },
    ],
    pricing: {
      instagram: {
        post: "₩500,000 ~ ₩800,000",
        story: "₩150,000 ~ ₩300,000",
        reel: "₩700,000 ~ ₩1,200,000",
      },
      youtube: {
        video: "₩1,500,000 ~ ₩3,000,000",
        shorts: "₩500,000 ~ ₩1,000,000",
      },
    },
  };

  const ContactModal = () => {
    const [step, setStep] = useState(1);
    const [contactData, setContactData] = useState({
      campaignTitle: "",
      message: "",
      budget: "",
      timeline: "",
    });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">인플루언서에게 연락하기</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">캠페인 정보</h3>
                  <input
                    type="text"
                    value={contactData.campaignTitle}
                    onChange={(e) =>
                      setContactData({
                        ...contactData,
                        campaignTitle: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="캠페인 제목을 입력해주세요"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">메시지</h3>
                  <textarea
                    value={contactData.message}
                    onChange={(e) =>
                      setContactData({
                        ...contactData,
                        message: e.target.value,
                      })
                    }
                    rows={6}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="캠페인에 대한 설명과 협업 제안 내용을 작성해주세요..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">예산</h3>
                    <input
                      type="text"
                      value={contactData.budget}
                      onChange={(e) =>
                        setContactData({
                          ...contactData,
                          budget: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="₩0"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">일정</h3>
                    <input
                      type="text"
                      value={contactData.timeline}
                      onChange={(e) =>
                        setContactData({
                          ...contactData,
                          timeline: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="예: 7월 20일 ~ 8월 20일"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700"
                  >
                    메시지 보내기
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <svg
                    className="w-16 h-16 text-green-500 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-bold mb-2">
                    메시지가 전송되었습니다!
                  </h3>
                  <p className="text-gray-600">
                    인플루언서가 확인 후 24시간 내에 답변드릴 예정입니다.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowContactModal(false);
                    router.push("/dashboard");
                  }}
                  className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700"
                >
                  대시보드로 이동
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 pt-32 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="profile-section">
              <Link
                href="/influencers"
                className="inline-flex items-center text-white/70 hover:text-white mb-6"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                인플루언서 목록으로
              </Link>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <img
                    src={influencer.avatar}
                    alt={influencer.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
                  />

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                          {influencer.name}
                        </h1>
                        <p className="text-xl text-white/80 mb-1">
                          {influencer.handle}
                        </p>
                        <div className="flex items-center gap-4 text-white/60">
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {influencer.location}
                          </span>
                          <span className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                              />
                            </svg>
                            {influencer.languages.join(", ")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mb-2">
                          <div className="flex text-yellow-400 mr-2">
                            {"★".repeat(Math.floor(influencer.rating))}
                          </div>
                          <span className="text-white font-semibold">
                            {influencer.rating}
                          </span>
                        </div>
                        <p className="text-white/60 text-sm">
                          {influencer.completedCampaigns}개 캠페인 완료
                        </p>
                      </div>
                    </div>

                    <p className="text-white/80 mb-6">{influencer.bio}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-white/60 text-sm mb-1">팔로워</p>
                        <p className="text-2xl font-bold text-white">
                          {influencer.followers}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">참여율</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          {influencer.engagement}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">
                          평균 조회수
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {influencer.avgViews}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm mb-1">총 도달수</p>
                        <p className="text-2xl font-bold text-white">
                          {influencer.stats.totalReach}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-6">
                  {influencer.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/20 text-white rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4 mt-6">
                  {influencer.platforms.includes("instagram") && (
                    <span className="px-4 py-2 bg-pink-500/20 text-pink-300 rounded-lg">
                      Instagram
                    </span>
                  )}
                  {influencer.platforms.includes("youtube") && (
                    <span className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg">
                      YouTube
                    </span>
                  )}
                  {influencer.platforms.includes("tiktok") && (
                    <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg">
                      TikTok
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "portfolio"
                  ? "border-cyan-600 text-cyan-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              포트폴리오
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "analytics"
                  ? "border-cyan-600 text-cyan-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              분석
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "pricing"
                  ? "border-cyan-600 text-cyan-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              가격 정보
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "reviews"
                  ? "border-cyan-600 text-cyan-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              리뷰 ({influencer.reviews.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {activeTab === "portfolio" && (
              <div className="profile-section">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {influencer.portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">{item.title}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          {item.type === "instagram" ? (
                            <>
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
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
                                {item.likes}
                              </span>
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                  />
                                </svg>
                                {item.comments}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                {item.views}
                              </span>
                              <span className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                  />
                                </svg>
                                {item.likes}
                              </span>
                            </>
                          )}
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              item.type === "instagram"
                                ? "bg-pink-100 text-pink-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.type === "instagram"
                              ? "Instagram"
                              : "YouTube"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="profile-section space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">성별 분포</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">여성</span>
                          <span className="text-sm font-medium">
                            {influencer.demographics.gender.female}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-pink-500 h-2 rounded-full"
                            style={{
                              width: `${influencer.demographics.gender.female}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">남성</span>
                          <span className="text-sm font-medium">
                            {influencer.demographics.gender.male}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${influencer.demographics.gender.male}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">연령대 분포</h3>
                    <div className="space-y-3">
                      {Object.entries(influencer.demographics.age).map(
                        ([age, percentage]) => (
                          <div key={age}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600">
                                {age}
                              </span>
                              <span className="text-sm font-medium">
                                {percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-cyan-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold mb-4">지역 분포</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {influencer.demographics.topLocations.map(
                      (location, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 border-b"
                        >
                          <span className="text-gray-700">
                            {location.split(" ")[0]}
                          </span>
                          <span className="font-medium text-cyan-600">
                            {location.split(" ")[1]}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <svg
                      className="w-8 h-8 text-cyan-600 mx-auto mb-2"
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
                    <p className="text-2xl font-bold">
                      {influencer.stats.avgLikes}
                    </p>
                    <p className="text-sm text-gray-600">평균 좋아요</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <svg
                      className="w-8 h-8 text-cyan-600 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-2xl font-bold">
                      {influencer.stats.avgComments}
                    </p>
                    <p className="text-sm text-gray-600">평균 댓글</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <svg
                      className="w-8 h-8 text-cyan-600 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 3.99A9 9 0 113 12a9.003 9.003 0 017.432-3.99m9.032 4.026A9.003 9.003 0 0120.932 8.01m-9.032 4.026a3.001 3.001 0 010-4.026"
                      />
                    </svg>
                    <p className="text-2xl font-bold">
                      {influencer.stats.avgShares}
                    </p>
                    <p className="text-sm text-gray-600">평균 공유</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                    <svg
                      className="w-8 h-8 text-cyan-600 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-2xl font-bold">
                      {influencer.stats.totalReach}
                    </p>
                    <p className="text-sm text-gray-600">총 도달수</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="profile-section">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">Instagram 가격</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium">피드 포스트</p>
                          <p className="text-sm text-gray-600">사진 + 캡션</p>
                        </div>
                        <p className="font-semibold text-cyan-600">
                          {influencer.pricing.instagram.post}
                        </p>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium">스토리</p>
                          <p className="text-sm text-gray-600">24시간 노출</p>
                        </div>
                        <p className="font-semibold text-cyan-600">
                          {influencer.pricing.instagram.story}
                        </p>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">릴스</p>
                          <p className="text-sm text-gray-600">15-60초 영상</p>
                        </div>
                        <p className="font-semibold text-cyan-600">
                          {influencer.pricing.instagram.reel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">YouTube 가격</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b">
                        <div>
                          <p className="font-medium">일반 영상</p>
                          <p className="text-sm text-gray-600">5분 이상</p>
                        </div>
                        <p className="font-semibold text-cyan-600">
                          {influencer.pricing.youtube.video}
                        </p>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">쇼츠</p>
                          <p className="text-sm text-gray-600">60초 이하</p>
                        </div>
                        <p className="font-semibold text-cyan-600">
                          {influencer.pricing.youtube.shorts}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
                  <div className="flex">
                    <svg
                      className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-1">
                        가격 안내
                      </h3>
                      <p className="text-blue-700 text-sm">
                        표시된 가격은 기본 가격 범위이며, 캠페인의 규모와
                        요구사항에 따라 협의 가능합니다. 패키지 할인도 가능하니
                        문의해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="profile-section space-y-6">
                {influencer.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{review.brand}</h4>
                        <div className="flex items-center mt-1">
                          <div className="flex text-yellow-400 mr-2">
                            {"★".repeat(review.rating)}
                          </div>
                          <span className="text-sm text-gray-600">
                            {review.date}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-8 sticky bottom-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                >
                  협업 제안하기
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  관심 인플루언서 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      {showContactModal && <ContactModal />}

      <Footer />
    </div>
  );
}
