"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Globe,
  Search,
  Edit2,
  Plus,
  Save,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Building,
  ShoppingCart,
  Star,
  Menu as MenuIcon,
  Layout,
  FileText,
  Users,
  Settings,
  MessageSquare,
} from "lucide-react";

interface LanguagePack {
  id: string;
  key: string;
  ko: string;
  en: string;
  ja: string;
  category: string;
  subcategory?: string;
}

type TabType = "campaigns" | "posts" | "menus" | "sections";

export default function ImprovedLanguagePacksPage() {
  const [activeTab, setActiveTab] = useState<TabType>("campaigns");
  const [searchTerm, setSearchTerm] = useState("");
  const [languagePacks, setLanguagePacks] = useState<LanguagePack[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{
    [key: string]: "saving" | "saved" | "error";
  }>({});

  // 탭 정의
  const tabs = [
    {
      id: "campaigns" as TabType,
      name: "캠페인",
      description: "병원/캠페인/구매평 등 캠페인 관련",
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "blue",
    },
    {
      id: "posts" as TabType,
      name: "게시물",
      description: "글 작성, 댓글, 리뷰 등",
      icon: <FileText className="w-5 h-5" />,
      color: "green",
    },
    {
      id: "menus" as TabType,
      name: "메뉴",
      description: "네비게이션 및 UI 메뉴",
      icon: <MenuIcon className="w-5 h-5" />,
      color: "purple",
    },
    {
      id: "sections" as TabType,
      name: "메인 섹션",
      description: "홈페이지 섹션 제목/설명",
      icon: <Layout className="w-5 h-5" />,
      color: "orange",
    },
  ];

  // 카테고리별 분류
  const categoryStructure = {
    campaigns: {
      병원: [
        "hospital.name",
        "hospital.description",
        "hospital.services",
        "hospital.booking",
      ],
      캠페인: [
        "campaign.title",
        "campaign.description",
        "campaign.deadline",
        "campaign.budget",
        "campaign.applicants",
      ],
      구매평: [
        "review.title",
        "review.content",
        "review.rating",
        "review.verified",
        "review.helpful",
      ],
    },
    posts: {
      "글 작성": ["post.create", "post.edit", "post.save", "post.publish"],
      댓글: [
        "comment.write",
        "comment.reply",
        "comment.edit",
        "comment.delete",
      ],
      리뷰: ["review.write", "review.edit", "review.submit", "review.rating"],
    },
    menus: {
      "헤더 메뉴": [
        "menu.home",
        "menu.campaigns",
        "menu.mypage",
        "menu.login",
        "menu.signup",
      ],
      "푸터 메뉴": [
        "footer.about",
        "footer.terms",
        "footer.privacy",
        "footer.contact",
      ],
      사이드바: [
        "sidebar.dashboard",
        "sidebar.profile",
        "sidebar.settings",
        "sidebar.logout",
      ],
    },
    sections: {
      "히어로 섹션": ["hero.title", "hero.subtitle", "hero.cta"],
      "특징 섹션": ["features.title", "features.subtitle", "features.items"],
      "통계 섹션": ["stats.users", "stats.campaigns", "stats.reviews"],
    },
  };

  // 데이터 로드
  useEffect(() => {
    loadLanguagePacks();
    // 모든 카테고리 자동 확장
    const defaultExpanded = new Set(
      Object.keys(categoryStructure[activeTab] || {}),
    );
    setExpandedCategories(defaultExpanded);
  }, [activeTab]);

  const loadLanguagePacks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/language-packs?category=${activeTab}`,
      );
      if (response.ok) {
        const data = await response.json();
        // API 응답 데이터 형식 변환 (ja -> ja)
        const transformedData = data.map((pack: any) => ({
          ...pack,
          ja: pack.jp || pack.ja, // jp 필드를 ja로 변환
        }));
        setLanguagePacks(transformedData);
      }
    } catch (error) {
      console.error("Failed to load language packs:", error);
    } finally {
      setLoading(false);
    }
  };

  // 샘플 데이터 초기화
  const initSampleData = async () => {
    if (!confirm("샘플 언어팩 데이터를 초기화하시겠습니까?")) return;

    try {
      const response = await fetch("/api/admin/language-packs/init", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(`성공: ${result.message}`);
        loadLanguagePacks(); // 데이터 새로고침
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      console.error("샘플 데이터 초기화 오류:", error);
      alert("샘플 데이터 초기화에 실패했습니다.");
    }
  };

  // 언어팩 저장
  const saveLanguagePack = async (pack: LanguagePack) => {
    setSaveStatus((prev) => ({ ...prev, [pack.id]: "saving" }));

    try {
      const response = await fetch(`/api/admin/language-packs/${pack.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pack),
      });

      if (response.ok) {
        setSaveStatus((prev) => ({ ...prev, [pack.id]: "saved" }));
        setTimeout(() => {
          setSaveStatus((prev) => {
            const newStatus = { ...prev };
            delete newStatus[pack.id];
            return newStatus;
          });
        }, 2000);
      } else {
        setSaveStatus((prev) => ({ ...prev, [pack.id]: "error" }));
      }
    } catch (error) {
      setSaveStatus((prev) => ({ ...prev, [pack.id]: "error" }));
    }
  };

  // 자동 번역
  const autoTranslate = async (text: string, targetLang: "en" | "ja") => {
    try {
      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang, sourceLang: "ko" }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.translatedText;
      }
    } catch (error) {
      console.error("Translation failed:", error);
    }
    return text;
  };

  // 편집 모드 토글
  const toggleEdit = (id: string) => {
    setEditingItem(editingItem === id ? null : id);
  };

  // 카테고리 확장 토글
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // 필터링된 언어팩
  const filteredPacks = languagePacks.filter(
    (pack) =>
      pack.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.ko.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.ja.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 카테고리별 그룹화
  const groupedPacks = filteredPacks.reduce(
    (acc, pack) => {
      const category = pack.subcategory || pack.category || "기타";
      if (!acc[category]) acc[category] = [];
      acc[category].push(pack);
      return acc;
    },
    {} as Record<string, LanguagePack[]>,
  );

  const renderLanguagePackItem = (pack: LanguagePack) => {
    const isEditing = editingItem === pack.id;
    const status = saveStatus[pack.id];

    return (
      <div
        key={pack.id}
        className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {pack.key}
            </span>
            {status === "saved" && <Check className="w-4 h-4 text-green-500" />}
            {status === "error" && <X className="w-4 h-4 text-red-500" />}
            {status === "saving" && (
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleEdit(pack.id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {isEditing && (
              <button
                onClick={() => saveLanguagePack(pack)}
                className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* 한국어 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              한국어 🇰🇷
            </label>
            {isEditing ? (
              <input
                type="text"
                value={pack.ko}
                onChange={(e) => {
                  setLanguagePacks((prev) =>
                    prev.map((p) =>
                      p.id === pack.id ? { ...p, ko: e.target.value } : p,
                    ),
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm text-gray-900">{pack.ko}</p>
            )}
          </div>

          {/* 영어 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">
              영어 🇺🇸
              {isEditing && (
                <button
                  onClick={async () => {
                    const translated = await autoTranslate(pack.ko, "en");
                    setLanguagePacks((prev) =>
                      prev.map((p) =>
                        p.id === pack.id ? { ...p, en: translated } : p,
                      ),
                    );
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  자동번역
                </button>
              )}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={pack.en}
                onChange={(e) => {
                  setLanguagePacks((prev) =>
                    prev.map((p) =>
                      p.id === pack.id ? { ...p, en: e.target.value } : p,
                    ),
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm text-gray-700">{pack.en}</p>
            )}
          </div>

          {/* 일본어 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">
              일본어 🇯🇵
              {isEditing && (
                <button
                  onClick={async () => {
                    const translated = await autoTranslate(pack.ko, "ja");
                    setLanguagePacks((prev) =>
                      prev.map((p) =>
                        p.id === pack.id ? { ...p, ja: translated } : p,
                      ),
                    );
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  자동번역
                </button>
              )}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={pack.ja}
                onChange={(e) => {
                  setLanguagePacks((prev) =>
                    prev.map((p) =>
                      p.id === pack.id ? { ...p, ja: e.target.value } : p,
                    ),
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm text-gray-700">{pack.ja}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                언어팩 관리 (개선 버전)
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                탭별로 체계적인 언어팩 관리와 개별 번역 편집
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={initSampleData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                샘플 데이터 초기화
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* 현재 탭 설명 */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              {tabs.find((tab) => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="언어팩 검색 (키, 한국어, 영어, 일본어)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="bg-white rounded-xl shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">언어팩을 불러오는 중...</p>
            </div>
          ) : (
            <div className="p-6">
              {Object.keys(groupedPacks).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPacks).map(([category, packs]) => (
                    <div
                      key={category}
                      className="border border-gray-200 rounded-lg"
                    >
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category}
                          </h3>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                            {packs.length}개
                          </span>
                        </div>
                        {expandedCategories.has(category) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {expandedCategories.has(category) && (
                        <div className="border-t border-gray-200 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {packs.map(renderLanguagePackItem)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 추가 기능 안내 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💡 개선된 언어팩 관리 기능
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <p>
                • <strong>탭별 관리:</strong> 캠페인, 게시물, 메뉴, 섹션별 분류
              </p>
              <p>
                • <strong>개별 편집:</strong> 각 언어팩 항목별 개별 수정
              </p>
              <p>
                • <strong>자동 번역:</strong> Google Translate API 개별 적용
              </p>
            </div>
            <div className="space-y-2">
              <p>
                • <strong>실시간 저장:</strong> 수정 즉시 개별 저장
              </p>
              <p>
                • <strong>상태 표시:</strong> 저장/오류 상태 실시간 표시
              </p>
              <p>
                • <strong>카테고리 접기:</strong> 대량 데이터 효율적 관리
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
