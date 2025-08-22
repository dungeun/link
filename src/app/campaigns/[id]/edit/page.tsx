"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Plus,
  X,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Camera,
  Instagram,
  Youtube,
  Twitter,
  CheckCircle,
  Info,
  Clock,
  Eye,
  FileText,
  Trash2,
} from "lucide-react";

interface CampaignFormData {
  // 기본 정보
  title: string;
  description: string;
  category: string;
  objectives: string[];
  status: "draft" | "active" | "paused" | "completed";

  // 타겟 설정
  platforms: string[];
  targetGender: "all" | "male" | "female";
  targetAgeMin: number;
  targetAgeMax: number;
  targetRegions: string[];
  minFollowers: number;

  // 캠페인 상세
  requirements: string[];
  hashtags: string[];
  mentionAccounts: string[];
  doList: string[];
  dontList: string[];

  // 예산 및 일정
  budget: number;
  paymentType: "fixed" | "performance";
  applicationDeadline: string;
  contentDeadline: string;
  campaignStartDate: string;
  campaignEndDate: string;

  // 미디어
  images: string[];
  referenceUrls: string[];

  // 통계
  applicantCount?: number;
  viewCount?: number;
  approvedCount?: number;
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    description: "",
    category: "",
    objectives: [],
    status: "active",
    platforms: [],
    targetGender: "all",
    targetAgeMin: 18,
    targetAgeMax: 65,
    targetRegions: [],
    minFollowers: 1000,
    requirements: [""],
    hashtags: [],
    mentionAccounts: [],
    doList: [""],
    dontList: [""],
    budget: 0,
    paymentType: "fixed",
    applicationDeadline: "",
    contentDeadline: "",
    campaignStartDate: "",
    campaignEndDate: "",
    images: [],
    referenceUrls: [""],
  });

  const categories = [
    { value: "beauty", label: "뷰티" },
    { value: "fashion", label: "패션" },
    { value: "food", label: "음식" },
    { value: "travel", label: "여행" },
    { value: "tech", label: "테크" },
    { value: "lifestyle", label: "라이프스타일" },
    { value: "sports", label: "스포츠" },
    { value: "entertainment", label: "엔터테인먼트" },
  ];

  const objectives = [
    { value: "brand_awareness", label: "브랜드 인지도 향상" },
    { value: "product_launch", label: "신제품 출시" },
    { value: "sales_increase", label: "매출 증대" },
    { value: "content_creation", label: "콘텐츠 제작" },
    { value: "event_promotion", label: "이벤트 홍보" },
    { value: "user_engagement", label: "사용자 참여 증대" },
  ];

  const platforms = [
    { value: "instagram", label: "인스타그램", icon: Instagram },
    { value: "youtube", label: "유튜브", icon: Youtube },
    { value: "tiktok", label: "틱톡", icon: null },
    { value: "blog", label: "블로그", icon: null },
    { value: "twitter", label: "트위터", icon: Twitter },
  ];

  const regions = [
    "서울",
    "경기",
    "인천",
    "대전",
    "대구",
    "부산",
    "광주",
    "울산",
    "세종",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
  ];

  const campaignStatuses = [
    { value: "draft", label: "초안", color: "bg-gray-100 text-gray-800" },
    { value: "active", label: "진행중", color: "bg-green-100 text-green-800" },
    {
      value: "paused",
      label: "일시중지",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "completed", label: "완료", color: "bg-blue-100 text-blue-800" },
  ];

  useEffect(() => {
    // Mock 데이터 로드
    setTimeout(() => {
      const mockData: CampaignFormData = {
        title: "여름 신제품 뷰티 리뷰 캠페인",
        description:
          "2024 여름 신제품 선크림과 수분크림을 체험하고 솔직한 리뷰를 작성해주세요.",
        category: "beauty",
        objectives: ["brand_awareness", "product_launch"],
        status: "active",
        platforms: ["instagram", "youtube"],
        targetGender: "female",
        targetAgeMin: 20,
        targetAgeMax: 35,
        targetRegions: ["서울", "경기"],
        minFollowers: 10000,
        requirements: [
          "인스타그램 피드 3개 이상",
          "스토리 5개 이상",
          "정품 태그 필수",
          "브랜드 계정 태그",
        ],
        hashtags: ["글로우코스메틱", "여름스킨케어", "선크림추천"],
        mentionAccounts: ["glowcosmetics", "glowbeauty"],
        doList: [
          "자연스러운 일상 속 사용 모습",
          "비포&애프터 비교샷",
          "제품 텍스처 클로즈업",
        ],
        dontList: ["경쟁사 제품 노출", "과도한 필터 사용", "부정적인 표현"],
        budget: 500000,
        paymentType: "fixed",
        applicationDeadline: "2024-07-15",
        contentDeadline: "2024-07-31",
        campaignStartDate: "2024-07-01",
        campaignEndDate: "2024-08-31",
        images: ["/images/campaign-1.jpg", "/images/campaign-2.jpg"],
        referenceUrls: [
          "https://example.com/reference1",
          "https://example.com/reference2",
        ],
        applicantCount: 45,
        viewCount: 1250,
        approvedCount: 12,
      };

      setFormData(mockData);
      setLoading(false);
    }, 1000);
  }, [campaignId]);

  useEffect(() => {
    // 변경사항 감지
    setHasChanges(true);
  }, [formData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 성공 시 캠페인 상세 페이지로 이동
      router.push(`/campaigns/${campaignId}?updated=true`);
    } catch (error) {
      console.error("캠페인 수정 실패:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 성공 시 캠페인 목록으로 이동
      router.push("/dashboard/campaigns?deleted=true");
    } catch (error) {
      console.error("캠페인 삭제 실패:", error);
    }
  };

  const addArrayItem = (field: keyof CampaignFormData, value: string = "") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value],
    }));
  };

  const removeArrayItem = (field: keyof CampaignFormData, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const updateArrayItem = (
    field: keyof CampaignFormData,
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) =>
        i === index ? value : item,
      ),
    }));
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
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                캠페인 수정
              </h1>
              {hasChanges && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                  수정됨
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                {saving ? "저장 중..." : "변경사항 저장"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 캠페인 통계 */}
      {(formData.applicantCount || formData.viewCount) && (
        <div className="bg-blue-50 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">조회수</span>
                <span className="font-medium text-gray-900">
                  {formData.viewCount?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">지원자</span>
                <span className="font-medium text-gray-900">
                  {formData.applicantCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">승인됨</span>
                <span className="font-medium text-gray-900">
                  {formData.approvedCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 폼 내용 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm">
            {/* 캠페인 상태 */}
            <div className="border-b px-8 py-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                캠페인 상태
              </label>
              <div className="flex gap-3">
                {campaignStatuses.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: status.value as
                          | "draft"
                          | "active"
                          | "paused"
                          | "completed",
                      }))
                    }
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      formData.status === status.value
                        ? status.color
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="px-8 py-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5" />
                기본 정보
              </h2>

              {/* 캠페인 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  캠페인 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 캠페인 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  캠페인 설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 카테고리 & 목표 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">카테고리 선택</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    캠페인 목표 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {objectives.map((obj) => (
                      <label
                        key={obj.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.objectives.includes(obj.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                objectives: [...prev.objectives, obj.value],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                objectives: prev.objectives.filter(
                                  (o) => o !== obj.value,
                                ),
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {obj.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 타겟 설정 */}
            <div className="border-t px-8 py-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                타겟 설정
              </h2>

              {/* 플랫폼 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  플랫폼 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => {
                        if (formData.platforms.includes(platform.value)) {
                          setFormData((prev) => ({
                            ...prev,
                            platforms: prev.platforms.filter(
                              (p) => p !== platform.value,
                            ),
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            platforms: [...prev.platforms, platform.value],
                          }));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                        formData.platforms.includes(platform.value)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {platform.icon && <platform.icon className="h-4 w-4" />}
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 타겟 상세 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    타겟 성별
                  </label>
                  <select
                    value={formData.targetGender}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetGender: e.target.value as
                          | "all"
                          | "male"
                          | "female",
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연령대
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.targetAgeMin}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          targetAgeMin: parseInt(e.target.value),
                        }))
                      }
                      min="13"
                      max="65"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">~</span>
                    <input
                      type="number"
                      value={formData.targetAgeMax}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          targetAgeMax: parseInt(e.target.value),
                        }))
                      }
                      min="13"
                      max="65"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최소 팔로워
                  </label>
                  <input
                    type="number"
                    value={formData.minFollowers}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minFollowers: parseInt(e.target.value),
                      }))
                    }
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 타겟 지역 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  타겟 지역 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {regions.map((region) => (
                    <label
                      key={region}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.targetRegions.includes(region)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              targetRegions: [...prev.targetRegions, region],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              targetRegions: prev.targetRegions.filter(
                                (r) => r !== region,
                              ),
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{region}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 캠페인 상세 */}
            <div className="border-t px-8 py-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                캠페인 상세
              </h2>

              {/* 요구사항 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요구사항 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) =>
                          updateArrayItem("requirements", index, e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 인스타그램 피드 3개 이상 포스팅"
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem("requirements", index)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addArrayItem("requirements")}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  요구사항 추가
                </button>
              </div>

              {/* 해시태그 & 멘션 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    필수 해시태그
                  </label>
                  <input
                    type="text"
                    placeholder="해시태그 입력 후 Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        const tag = e.currentTarget.value
                          .trim()
                          .replace(/^#/, "");
                        if (!formData.hashtags.includes(tag)) {
                          setFormData((prev) => ({
                            ...prev,
                            hashtags: [...prev.hashtags, tag],
                          }));
                        }
                        e.currentTarget.value = "";
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.hashtags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeArrayItem("hashtags", index)}
                          className="hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    필수 멘션 계정
                  </label>
                  <input
                    type="text"
                    placeholder="@계정명 입력 후 Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        const account = e.currentTarget.value
                          .trim()
                          .replace(/^@/, "");
                        if (!formData.mentionAccounts.includes(account)) {
                          setFormData((prev) => ({
                            ...prev,
                            mentionAccounts: [...prev.mentionAccounts, account],
                          }));
                        }
                        e.currentTarget.value = "";
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.mentionAccounts.map((account, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        @{account}
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayItem("mentionAccounts", index)
                          }
                          className="hover:text-gray-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 예산 및 일정 */}
            <div className="border-t px-8 py-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                예산 및 일정
              </h2>

              {/* 예산 설정 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    캠페인 예산 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          budget: parseInt(e.target.value) || 0,
                        }))
                      }
                      min="0"
                      step="10000"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지급 방식
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentType: e.target.value as "fixed" | "performance",
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">고정 금액</option>
                    <option value="performance">성과 기반</option>
                  </select>
                </div>
              </div>

              {/* 일정 설정 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    지원 마감일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        applicationDeadline: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    콘텐츠 제출 마감일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.contentDeadline}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contentDeadline: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    캠페인 시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.campaignStartDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        campaignStartDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    캠페인 종료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.campaignEndDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        campaignEndDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                캠페인 삭제
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              이 캠페인을 삭제하시겠습니까? 삭제된 캠페인은 복구할 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
