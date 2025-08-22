"use client";

import { useState, useEffect } from "react";
import {
  X,
  Save,
  Building2,
  Calendar,
  DollarSign,
  Users,
  Image,
  FileText,
  Hash,
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface CampaignDetail {
  id: string;
  title: string;
  description: string;
  business: {
    id: string;
    name: string;
    email: string;
    businessProfile?: {
      companyName: string;
      businessNumber: string;
      representativeName: string;
      businessCategory: string;
      phone?: string;
      address?: string;
    };
  };
  platform: string;
  platforms?: string[];
  budget: number;
  targetFollowers: number;
  maxApplicants: number;
  startDate: string;
  endDate: string;
  applicationStartDate?: string;
  applicationEndDate?: string;
  contentStartDate?: string;
  contentEndDate?: string;
  requirements?: string;
  hashtags?: string;
  keywords?: string;
  imageUrl?: string;
  headerImageUrl?: string;
  thumbnailImageUrl?: string;
  productImages?: string;
  detailImages?: string;
  status: string;
  isPaid: boolean;
  platformFeeRate: number;
  provisionDetails?: string;
  campaignMission?: string;
  additionalNotes?: string;
  youtubeUrl?: string;
}

interface CampaignEditModalProps {
  campaignId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function CampaignEditModal({
  campaignId,
  isOpen,
  onClose,
  onSave,
}: CampaignEditModalProps) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("campaign");

  // 수정 폼 상태
  const [formData, setFormData] = useState<Partial<CampaignDetail>>({});
  const [businessFormData, setBusinessFormData] = useState<any>({});
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // 메시지 초기화
      setError("");
      setSuccessMessage("");

      if (campaignId) {
        fetchCampaignDetail();
      }
      fetchBusinesses(); // 모달이 열릴 때마다 업체 목록 가져오기
    }
    // 모달이 닫힐 때는 상태를 초기화하지 않음 - 저장 후 새로고침을 위해
  }, [campaignId, isOpen]);

  // selectedBusinessId가 변경될 때마다 로그 출력 (디버깅용)
  useEffect(() => {
    console.log("selectedBusinessId 상태 변경:", selectedBusinessId);
  }, [selectedBusinessId]);

  const fetchCampaignDetail = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      setError("");
      const response = await adminApi.get(`/api/admin/campaigns/${campaignId}`);

      if (response.ok) {
        const data = await response.json();
        console.log("캠페인 상세 데이터 로드:", data.campaign);

        const campaignData = data.campaign;
        const businessId = campaignData.business?.id || "";

        // 상태 동기화 - 순서가 중요함
        setCampaign(campaignData);

        // formData는 businessId를 포함하여 설정
        setFormData({
          ...campaignData,
          businessId: businessId,
        });

        // 업체 관련 상태 설정
        setSelectedBusinessId(businessId);
        setBusinessFormData({
          ...(campaignData.business?.businessProfile || {}),
        });

        console.log("상태 동기화 완료 - businessId:", businessId);
      } else {
        setError("캠페인 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("캠페인 상세 조회 실패:", error);
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const response = await adminApi.get("/api/admin/businesses");
      if (response.ok) {
        const data = await response.json();
        console.log("업체 목록 응답:", data); // 전체 응답 확인
        console.log("업체 목록:", data.businesses); // 디버깅용
        setBusinesses(data.businesses || []);
      } else {
        console.error("업체 목록 조회 실패 - 응답 코드:", response.status);
        const errorData = await response.json();
        console.error("에러 메시지:", errorData);
      }
    } catch (error) {
      console.error("업체 목록 조회 실패:", error);
    }
  };

  const handleSaveCampaign = async () => {
    if (!campaignId || !formData) return;

    try {
      setSaving(true);

      // businessId 우선순위: selectedBusinessId > 원래 업체 ID
      const finalBusinessId = selectedBusinessId || campaign?.business?.id;

      // 빈 문자열이면 null로 처리
      const businessIdToSend =
        finalBusinessId && finalBusinessId.trim() !== ""
          ? finalBusinessId
          : null;

      const updateData = {
        ...formData,
        businessId: businessIdToSend,
      };

      console.log("=== 캠페인 저장 시작 ===");
      console.log("저장할 데이터:", updateData);
      console.log("최종 업체 ID:", businessIdToSend);
      console.log("원래 업체 ID:", campaign?.business?.id);
      console.log(
        "업체 변경 여부:",
        businessIdToSend !== campaign?.business?.id,
      );

      const response = await adminApi.put(
        `/api/admin/campaigns/${campaignId}`,
        updateData,
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("저장 성공:", responseData);

        // 성공 메시지 표시
        setSuccessMessage("캠페인이 성공적으로 수정되었습니다.");
        setError("");

        // 3초 후 성공 메시지 자동 제거
        setTimeout(() => setSuccessMessage(""), 3000);

        // 데이터 새로고침을 위해 캠페인 상세 정보를 다시 가져옴
        await fetchCampaignDetail();
        onSave?.();
      } else {
        const data = await response.json();
        console.error("저장 실패:", data);
        setError(data.error || "캠페인 수정에 실패했습니다.");
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("캠페인 수정 실패:", error);
      setError("캠페인 수정 중 오류가 발생했습니다.");
      setSuccessMessage("");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!selectedBusinessId || !businessFormData) return;

    try {
      setSaving(true);
      const response = await adminApi.put(
        `/api/admin/business/${selectedBusinessId}`,
        {
          businessProfile: businessFormData,
        },
      );

      if (response.ok) {
        alert("업체 정보가 성공적으로 수정되었습니다.");
        fetchCampaignDetail(); // 데이터 새로고침
      } else {
        const data = await response.json();
        alert(data.error || "업체 정보 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("업체 정보 수정 실패:", error);
      alert("업체 정보 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBusinessInputChange = (field: string, value: any) => {
    setBusinessFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />

      {/* 슬라이드 패널 */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl transform transition-transform duration-300 z-[9999] ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* 헤더 */}
        <div className="relative bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              캠페인 및 업체 정보 수정
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 탭 메뉴 */}
          <div className="mt-4 flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("campaign")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "campaign"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              캠페인 정보
            </button>
            <button
              onClick={() => setActiveTab("business")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "business"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              업체 정보
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "images"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              이미지 관리
            </button>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div
          className="overflow-y-auto"
          style={{ height: "calc(100% - 80px)" }}
        >
          {/* 성공/에러 메시지 */}
          {(successMessage || error) && (
            <div className="mx-6 mt-4">
              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        {successMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error && !campaign ? (
            <div className="p-6 text-center text-red-600">
              캠페인 정보를 불러올 수 없습니다.
            </div>
          ) : (
            campaign && (
              <>
                {/* 캠페인 정보 탭 */}
                {activeTab === "campaign" && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 기본 정보 */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <FileText className="w-5 h-5 mr-2" />
                          기본 정보
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            캠페인 제목
                          </label>
                          <input
                            type="text"
                            value={formData.title || ""}
                            onChange={(e) =>
                              handleInputChange("title", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            설명
                          </label>
                          <textarea
                            value={formData.description || ""}
                            onChange={(e) =>
                              handleInputChange("description", e.target.value)
                            }
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            플랫폼
                          </label>
                          <select
                            value={formData.platform || ""}
                            onChange={(e) =>
                              handleInputChange("platform", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="INSTAGRAM">인스타그램</option>
                            <option value="YOUTUBE">유튜브</option>
                            <option value="TIKTOK">틱톡</option>
                            <option value="NAVERBLOG">네이버 블로그</option>
                            <option value="FACEBOOK">페이스북</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            상태
                          </label>
                          <select
                            value={formData.status || ""}
                            onChange={(e) =>
                              handleInputChange("status", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="DRAFT">초안</option>
                            <option value="PENDING_REVIEW">승인대기</option>
                            <option value="ACTIVE">진행중</option>
                            <option value="PAUSED">일시중지</option>
                            <option value="COMPLETED">완료</option>
                            <option value="REJECTED">거절됨</option>
                            <option value="CANCELLED">취소</option>
                          </select>
                        </div>
                      </div>

                      {/* 모집 정보 */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          모집 정보
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            예산 (원)
                          </label>
                          <input
                            type="number"
                            value={formData.budget || 0}
                            onChange={(e) =>
                              handleInputChange(
                                "budget",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            최소 팔로워 수
                          </label>
                          <input
                            type="number"
                            value={formData.targetFollowers || 0}
                            onChange={(e) =>
                              handleInputChange(
                                "targetFollowers",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            최대 모집 인원
                          </label>
                          <input
                            type="number"
                            value={formData.maxApplicants || 0}
                            onChange={(e) =>
                              handleInputChange(
                                "maxApplicants",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            플랫폼 수수료율 (%)
                          </label>
                          <input
                            type="number"
                            value={(formData.platformFeeRate || 0.2) * 100}
                            onChange={(e) =>
                              handleInputChange(
                                "platformFeeRate",
                                parseFloat(e.target.value) / 100,
                              )
                            }
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 일정 정보 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        일정 정보
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            캠페인 시작일
                          </label>
                          <input
                            type="date"
                            value={formData.startDate?.split("T")[0] || ""}
                            onChange={(e) =>
                              handleInputChange("startDate", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            캠페인 종료일
                          </label>
                          <input
                            type="date"
                            value={formData.endDate?.split("T")[0] || ""}
                            onChange={(e) =>
                              handleInputChange("endDate", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            지원 시작일
                          </label>
                          <input
                            type="date"
                            value={
                              formData.applicationStartDate?.split("T")[0] || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "applicationStartDate",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            지원 종료일
                          </label>
                          <input
                            type="date"
                            value={
                              formData.applicationEndDate?.split("T")[0] || ""
                            }
                            onChange={(e) =>
                              handleInputChange(
                                "applicationEndDate",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 상세 정보 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Hash className="w-5 h-5 mr-2" />
                        상세 정보
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          요구사항
                        </label>
                        <textarea
                          value={formData.requirements || ""}
                          onChange={(e) =>
                            handleInputChange("requirements", e.target.value)
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          해시태그 (공백으로 구분)
                        </label>
                        <input
                          type="text"
                          value={formData.hashtags || ""}
                          onChange={(e) =>
                            handleInputChange("hashtags", e.target.value)
                          }
                          placeholder="#예시 #해시태그"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          키워드 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          value={formData.keywords || ""}
                          onChange={(e) =>
                            handleInputChange("keywords", e.target.value)
                          }
                          placeholder="키워드1, 키워드2, 키워드3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          제공 내역
                        </label>
                        <textarea
                          value={formData.provisionDetails || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "provisionDetails",
                              e.target.value,
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          캠페인 미션
                        </label>
                        <textarea
                          value={formData.campaignMission || ""}
                          onChange={(e) =>
                            handleInputChange("campaignMission", e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          추가 안내사항
                        </label>
                        <textarea
                          value={formData.additionalNotes || ""}
                          onChange={(e) =>
                            handleInputChange("additionalNotes", e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveCampaign}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            저장 중...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            캠페인 정보 저장
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 업체 정보 탭 */}
                {activeTab === "business" && (
                  <div className="p-6 space-y-6">
                    {/* 업체 선택 */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        업체 계정 변경 (현재: {campaign?.business?.name})
                      </label>
                      {businesses.length > 0 ? (
                        <select
                          value={selectedBusinessId}
                          onChange={(e) => {
                            const newBusinessId = e.target.value;
                            console.log("=== 업체 선택 변경 ===");
                            console.log("새로운 업체 ID:", newBusinessId);
                            console.log("이전 업체 ID:", selectedBusinessId);

                            // 상태 업데이트
                            setSelectedBusinessId(newBusinessId);

                            // formData에도 즉시 동기화
                            setFormData((prev) => ({
                              ...prev,
                              businessId: newBusinessId,
                            }));

                            // 선택한 업체의 프로필 정보 로드
                            if (newBusinessId && newBusinessId.trim() !== "") {
                              const selectedBusiness = businesses.find(
                                (b) => b.id === newBusinessId,
                              );
                              if (selectedBusiness?.businessProfile) {
                                console.log(
                                  "업체 프로필 로드:",
                                  selectedBusiness.businessProfile,
                                );
                                setBusinessFormData({
                                  ...selectedBusiness.businessProfile,
                                });
                              } else {
                                console.log(
                                  "업체 프로필 없음 - 기본값으로 초기화",
                                );
                                setBusinessFormData({});
                              }
                            } else {
                              console.log("빈 업체 ID - 프로필 초기화");
                              setBusinessFormData({});
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">업체를 선택하세요</option>
                          {businesses.map((business) => (
                            <option key={business.id} value={business.id}>
                              {business.name} ({business.email}) -{" "}
                              {business.businessProfile?.companyName ||
                                "회사명 없음"}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded-lg">
                          업체 목록을 불러오는 중...
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 기본 정보 */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Building2 className="w-5 h-5 mr-2" />
                          업체 기본 정보
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            회사명
                          </label>
                          <input
                            type="text"
                            value={businessFormData.companyName || ""}
                            onChange={(e) =>
                              handleBusinessInputChange(
                                "companyName",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            사업자등록번호
                          </label>
                          <input
                            type="text"
                            value={businessFormData.businessNumber || ""}
                            onChange={(e) =>
                              handleBusinessInputChange(
                                "businessNumber",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            대표자명
                          </label>
                          <input
                            type="text"
                            value={businessFormData.representativeName || ""}
                            onChange={(e) =>
                              handleBusinessInputChange(
                                "representativeName",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            업종
                          </label>
                          <select
                            value={businessFormData.businessCategory || ""}
                            onChange={(e) =>
                              handleBusinessInputChange(
                                "businessCategory",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">선택하세요</option>
                            <option value="마케팅">마케팅</option>
                            <option value="IT">IT/소프트웨어</option>
                            <option value="패션">패션/의류</option>
                            <option value="뷰티">뷰티/화장품</option>
                            <option value="식품">식품/음료</option>
                            <option value="교육">교육/출판</option>
                            <option value="여행">여행/관광</option>
                            <option value="기타">기타</option>
                          </select>
                        </div>
                      </div>

                      {/* 연락처 정보 */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          연락처 정보
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            이메일
                          </label>
                          <input
                            type="email"
                            value={campaign?.business?.email || ""}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            전화번호
                          </label>
                          <input
                            type="tel"
                            value={businessFormData.phone || ""}
                            onChange={(e) =>
                              handleBusinessInputChange("phone", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            주소
                          </label>
                          <textarea
                            value={businessFormData.address || ""}
                            onChange={(e) =>
                              handleBusinessInputChange(
                                "address",
                                e.target.value,
                              )
                            }
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveBusiness}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            저장 중...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            업체 정보 저장
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 이미지 관리 탭 */}
                {activeTab === "images" && (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Image className="w-5 h-5 mr-2" />
                        이미지 URL 관리
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          메인 이미지 URL
                        </label>
                        <input
                          type="text"
                          value={formData.imageUrl || ""}
                          onChange={(e) =>
                            handleInputChange("imageUrl", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {formData.imageUrl && (
                          <img
                            src={formData.imageUrl}
                            alt="메인 이미지"
                            className="mt-2 h-32 object-cover rounded"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          헤더 이미지 URL
                        </label>
                        <input
                          type="text"
                          value={formData.headerImageUrl || ""}
                          onChange={(e) =>
                            handleInputChange("headerImageUrl", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {formData.headerImageUrl && (
                          <img
                            src={formData.headerImageUrl}
                            alt="헤더 이미지"
                            className="mt-2 h-32 object-cover rounded"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          썸네일 이미지 URL
                        </label>
                        <input
                          type="text"
                          value={formData.thumbnailImageUrl || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "thumbnailImageUrl",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {formData.thumbnailImageUrl && (
                          <img
                            src={formData.thumbnailImageUrl}
                            alt="썸네일 이미지"
                            className="mt-2 h-32 object-cover rounded"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          유튜브 URL
                        </label>
                        <input
                          type="text"
                          value={formData.youtubeUrl || ""}
                          onChange={(e) =>
                            handleInputChange("youtubeUrl", e.target.value)
                          }
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          제품 이미지 URLs (JSON 배열)
                        </label>
                        <textarea
                          value={formData.productImages || ""}
                          onChange={(e) =>
                            handleInputChange("productImages", e.target.value)
                          }
                          rows={4}
                          placeholder='["https://example.com/image1.jpg", "https://example.com/image2.jpg"]'
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          상세 이미지 URLs (JSON 배열)
                        </label>
                        <textarea
                          value={formData.detailImages || ""}
                          onChange={(e) =>
                            handleInputChange("detailImages", e.target.value)
                          }
                          rows={4}
                          placeholder='["https://example.com/detail1.jpg", "https://example.com/detail2.jpg"]'
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                      </div>
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveCampaign}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            저장 중...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            이미지 정보 저장
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>
    </>
  );
}
