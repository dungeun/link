"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Globe,
  ChevronUp,
  ChevronDown,
  Shield,
  Tag,
  ShoppingCart,
  AlertTriangle,
  Smartphone,
  Heart,
  BookOpen,
  ThumbsUp,
  Users,
  Flower2,
  GraduationCap,
  RefreshCw,
} from "lucide-react";

interface CategoryMenu {
  id: string;
  name: string;
  nameEn?: string;
  nameJp?: string;
  link: string;
  icon?: string;
  iconType?: "emoji" | "lucide";
  badge?: string;
  badgeColor?: string;
  visible: boolean;
  order: number;
}

// 고정된 카테고리 메뉴 목록 (스크린샷 기반)
const defaultCategories: CategoryMenu[] = [
  {
    id: "1",
    name: "뷰티",
    nameEn: "Beauty",
    nameJp: "ビューティー",
    link: "/beauty",
    icon: "Shield",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 1,
  },
  {
    id: "2",
    name: "패션",
    nameEn: "Fashion",
    nameJp: "ファッション",
    link: "/fashion",
    icon: "Tag",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 2,
  },
  {
    id: "3",
    name: "맛집",
    nameEn: "Food",
    nameJp: "グルメ",
    link: "/food",
    icon: "ShoppingCart",
    iconType: "lucide",
    badge: "HOT",
    badgeColor: "red",
    visible: true,
    order: 3,
  },
  {
    id: "4",
    name: "여행",
    nameEn: "Travel",
    nameJp: "旅行",
    link: "/travel",
    icon: "AlertTriangle",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 4,
  },
  {
    id: "5",
    name: "IT/테크",
    nameEn: "IT/Tech",
    nameJp: "IT/テック",
    link: "/tech",
    icon: "Smartphone",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 5,
  },
  {
    id: "6",
    name: "운동/헬스",
    nameEn: "Fitness",
    nameJp: "フィットネス",
    link: "/fitness",
    icon: "Heart",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 6,
  },
  {
    id: "7",
    name: "라이프",
    nameEn: "Lifestyle",
    nameJp: "ライフスタイル",
    link: "/lifestyle",
    icon: "BookOpen",
    iconType: "lucide",
    badge: "신규",
    badgeColor: "blue",
    visible: true,
    order: 7,
  },
  {
    id: "8",
    name: "반려동물",
    nameEn: "Pet",
    nameJp: "ペット",
    link: "/pet",
    icon: "ThumbsUp",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 8,
  },
  {
    id: "9",
    name: "육아",
    nameEn: "Parenting",
    nameJp: "育児",
    link: "/parenting",
    icon: "Users",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 9,
  },
  {
    id: "10",
    name: "게임",
    nameEn: "Games",
    nameJp: "ゲーム",
    link: "/game",
    icon: "Flower2",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 10,
  },
  {
    id: "11",
    name: "교육",
    nameEn: "Education",
    nameJp: "教育",
    link: "/education",
    icon: "GraduationCap",
    iconType: "lucide",
    badge: "",
    visible: true,
    order: 11,
  },
];

// Lucide 아이콘 컴포넌트 매핑
const iconComponents: { [key: string]: any } = {
  Shield,
  Tag,
  ShoppingCart,
  AlertTriangle,
  Smartphone,
  Heart,
  BookOpen,
  ThumbsUp,
  Users,
  Flower2,
  GraduationCap,
};

export default function CategorySectionEditPage() {
  const router = useRouter();
  const [categoryMenus, setCategoryMenus] = useState<CategoryMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [gridLayout, setGridLayout] = useState("6x11");

  // JSON에서 데이터 로드 (DB 대신)
  useEffect(() => {
    loadSectionFromJSON();
  }, []);

  const loadSectionFromJSON = async () => {
    try {
      setLoading(true);
      // JSON에서 직접 데이터 가져오기
      const response = await fetch(
        "/api/admin/sections-to-json?section=category",
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.data?.categories) {
          // JSON 데이터를 Admin 형식으로 변환
          const convertedCategories = data.data.categories.map((cat: any) => ({
            id: cat.id,
            name: typeof cat.name === "object" ? cat.name.ko : cat.name,
            nameEn: typeof cat.name === "object" ? cat.name.en : cat.name,
            nameJp: typeof cat.name === "object" ? cat.name.jp : cat.name,
            link: cat.href || `/category/${cat.slug}`,
            icon: cat.icon || "📁",
            iconType:
              cat.icon && !cat.icon.startsWith("http") && cat.icon.length === 1
                ? "lucide"
                : "emoji",
            badge: cat.badge || "",
            badgeColor: cat.badgeColor || "",
            visible: cat.visible ?? true,
            order: cat.order || 1,
          }));
          setCategoryMenus(convertedCategories);
        } else {
          // 데이터가 없으면 기본값 사용
          setCategoryMenus(defaultCategories);
        }
        setSectionVisible(data?.visible ?? true);
      } else {
        // JSON이 없으면 기본 데이터로 초기화
        setCategoryMenus(defaultCategories);
      }
    } catch (error) {
      console.error("Error loading section from JSON:", error);
      setCategoryMenus(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    const newCategory: CategoryMenu = {
      id: Date.now().toString(),
      name: "새 카테고리",
      nameEn: "New Category",
      nameJp: "新しいカテゴリ",
      link: "/new-category",
      icon: "Shield",
      iconType: "lucide",
      badge: "",
      badgeColor: "",
      visible: true,
      order: categoryMenus.length + 1,
    };
    setCategoryMenus([...categoryMenus, newCategory]);
  };

  const handleUpdateCategory = (id: string, updates: Partial<CategoryMenu>) => {
    setCategoryMenus(
      categoryMenus.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat,
      ),
    );
  };

  // 자동 번역 함수
  const handleAutoTranslate = async () => {
    if (!autoTranslate) {
      alert("자동 번역이 비활성화되어 있습니다.");
      return;
    }

    setTranslating(true);
    alert("번역 중입니다...");
    try {
      const translatedCategories = await Promise.all(
        categoryMenus.map(async (cat) => {
          const response = await fetch("/admin/translations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              texts: {
                name: cat.name,
                badge: cat.badge,
              },
              targetLanguages: ["en", "jp"],
            }),
          });

          if (!response.ok) {
            throw new Error("번역 실패");
          }

          const translated = await response.json();

          return {
            ...cat,
            nameEn: translated.name?.en || cat.nameEn,
            nameJp: translated.name?.jp || cat.nameJp,
          };
        }),
      );

      setCategoryMenus(translatedCategories);
      alert("번역이 완료되었습니다.");
    } catch (error) {
      console.error("Translation error:", error);
      alert("번역 중 오류가 발생했습니다.");
    } finally {
      setTranslating(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategoryMenus(categoryMenus.filter((cat) => cat.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMenus = [...categoryMenus];
    [newMenus[index - 1], newMenus[index]] = [
      newMenus[index],
      newMenus[index - 1],
    ];

    // 순서 재정렬
    const reorderedMenus = newMenus.map((menu, idx) => ({
      ...menu,
      order: idx + 1,
    }));
    setCategoryMenus(reorderedMenus);
  };

  const handleMoveDown = (index: number) => {
    if (index === categoryMenus.length - 1) return;
    const newMenus = [...categoryMenus];
    [newMenus[index], newMenus[index + 1]] = [
      newMenus[index + 1],
      newMenus[index],
    ];

    // 순서 재정렬
    const reorderedMenus = newMenus.map((menu, idx) => ({
      ...menu,
      order: idx + 1,
    }));
    setCategoryMenus(reorderedMenus);
  };

  const handleSave = async () => {
    setSaving(true);

    // 자동 번역이 활성화되어 있고 영어/일본어 번역이 비어있으면 먼저 번역
    if (autoTranslate) {
      const needsTranslation = categoryMenus.some(
        (cat) => !cat.nameEn || !cat.nameJp,
      );

      if (needsTranslation) {
        alert("번역 중입니다. 잠시만 기다려주세요...");
        await handleAutoTranslate();
      }
    }

    try {
      // JSON으로 직접 저장 (다국어 지원)
      const convertedCategories = categoryMenus.map((cat) => ({
        id: cat.id,
        name: {
          ko: cat.name,
          en: cat.nameEn || cat.name,
          jp: cat.nameJp || cat.name,
        },
        slug: cat.link?.replace("/category/", "").replace("/", "") || cat.name,
        icon: cat.icon,
        href: cat.link,
        order: cat.order,
        visible: cat.visible,
        badge: cat.badge || null,
        badgeColor: cat.badgeColor || null,
      }));

      const response = await fetch("/api/admin/sections-to-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: "category",
          data: {
            categories: convertedCategories,
            gridLayout,
            visible: sectionVisible,
          },
        }),
      });

      if (response.ok) {
        alert("저장되었습니다.");
        // 필요시 DB에도 저장 (선택적)
        // await fetch('/api/admin/ui-sections/category', {...})
        router.push("/admin/ui-config?tab=sections");
      } else {
        throw new Error("Save failed");
      }
    } catch (error) {
      console.error("Error saving section:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const badgeOptions = [
    { value: "", label: "없음", color: "" },
    { value: "HOT", label: "HOT", color: "red" },
    { value: "신규", label: "신규", color: "blue" },
    { value: "NEW", label: "NEW", color: "green" },
    { value: "BEST", label: "BEST", color: "purple" },
    { value: "인기", label: "인기", color: "orange" },
    { value: "추천", label: "추천", color: "yellow" },
    { value: "SALE", label: "SALE", color: "pink" },
  ];

  const iconOptions = [
    { value: "Shield", label: "방패 (뷰티)" },
    { value: "Tag", label: "태그 (패션)" },
    { value: "ShoppingCart", label: "장바구니 (맛집)" },
    { value: "AlertTriangle", label: "삼각형 (여행)" },
    { value: "Smartphone", label: "스마트폰 (IT/테크)" },
    { value: "Heart", label: "하트 (운동/헬스)" },
    { value: "BookOpen", label: "책 (라이프)" },
    { value: "ThumbsUp", label: "엄지 (반려동물)" },
    { value: "Users", label: "사용자 (육아)" },
    { value: "Flower2", label: "꽃 (게임)" },
    { value: "GraduationCap", label: "졸업모자 (교육)" },
  ];

  const renderIcon = (category: CategoryMenu) => {
    if (category.iconType === "emoji") {
      return <span className="text-2xl">{category.icon}</span>;
    } else if (category.iconType === "lucide" && category.icon) {
      const IconComponent = iconComponents[category.icon];
      if (IconComponent) {
        return <IconComponent className="w-6 h-6 text-indigo-600" />;
      }
    }
    return <Shield className="w-6 h-6 text-indigo-600" />;
  };

  const getBadgeColorClass = (color?: string) => {
    const colorMap: { [key: string]: string } = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      yellow: "bg-yellow-500",
      pink: "bg-pink-500",
    };
    return colorMap[color || ""] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin/ui-config?tab=sections")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  카테고리 메뉴 관리
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  메인 페이지에 표시되는 카테고리 아이콘 메뉴를 관리합니다
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* 자동 번역 토글 */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoTranslate}
                    onChange={(e) => setAutoTranslate(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      autoTranslate ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform mt-1 ${
                        autoTranslate ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span className="flex items-center gap-1 text-sm text-gray-700">
                    <Globe className="w-4 h-4" />
                    자동 번역
                  </span>
                </label>

                {/* 번역 새로고침 버튼 */}
                {autoTranslate && (
                  <button
                    onClick={handleAutoTranslate}
                    disabled={translating}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="한국어 기준으로 번역 새로고침"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${translating ? "animate-spin" : ""}`}
                    />
                  </button>
                )}
              </div>

              {/* 섹션 표시 토글 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sectionVisible}
                  onChange={(e) => setSectionVisible(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    sectionVisible ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform mt-1 ${
                      sectionVisible ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
                <span className="flex items-center gap-1 text-sm text-gray-700">
                  <Eye className="w-4 h-4" />
                  섹션 표시
                </span>
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">미리보기</h2>
          <div className="flex flex-wrap gap-4 justify-center p-4 bg-gray-50 rounded-lg">
            {categoryMenus
              .filter((cat) => cat.visible)
              .sort((a, b) => a.order - b.order)
              .map((category) => (
                <div
                  key={category.id}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      {renderIcon(category)}
                    </div>
                    {category.badge && (
                      <span
                        className={`absolute -top-1 -right-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${getBadgeColorClass(
                          category.badgeColor,
                        )}`}
                      >
                        {category.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-700">{category.name}</span>
                </div>
              ))}
          </div>
        </div>

        {/* 카테고리 목록 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">카테고리 설정</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCategoryMenus(defaultCategories)}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                기본값 복원
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                카테고리 추가
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {categoryMenus
              .sort((a, b) => a.order - b.order)
              .map((category, index) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    {/* 순서 조절 */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-center text-gray-500">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === categoryMenus.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 아이콘 미리보기 */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border">
                          {renderIcon(category)}
                        </div>
                        {category.badge && (
                          <span
                            className={`absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white ${getBadgeColorClass(
                              category.badgeColor,
                            )}`}
                          >
                            {category.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 카테고리 정보 입력 */}
                    <div className="flex-1 space-y-3">
                      {/* 첫 줄: 기본 정보 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            링크 URL
                          </label>
                          <input
                            type="text"
                            value={category.link}
                            onChange={(e) =>
                              handleUpdateCategory(category.id, {
                                link: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="/category-url"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            아이콘
                          </label>
                          <select
                            value={category.icon || ""}
                            onChange={(e) =>
                              handleUpdateCategory(category.id, {
                                icon: e.target.value,
                                iconType: "lucide",
                              })
                            }
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                          >
                            {iconOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            배지
                          </label>
                          <select
                            value={category.badge || ""}
                            onChange={(e) =>
                              handleUpdateCategory(category.id, {
                                badge: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                          >
                            {badgeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            배지 색상
                          </label>
                          <select
                            value={category.badgeColor || ""}
                            onChange={(e) =>
                              handleUpdateCategory(category.id, {
                                badgeColor: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                          >
                            {badgeOptions.map((option) => (
                              <option key={option.value} value={option.color}>
                                {option.label}{" "}
                                {option.color && `(${option.color})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 둘째 줄: 다국어 이름 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            한국어 이름 🇰🇷
                          </label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) =>
                              handleUpdateCategory(category.id, {
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="맛집"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            영어 이름 🇺🇸
                          </label>
                          <input
                            type="text"
                            value={category.nameEn || ""}
                            onChange={(e) =>
                              handleUpdateCategory(category.id, {
                                nameEn: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Food"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            일본어 이름 🇯🇵
                          </label>
                          <input
                            type="text"
                            value={category.nameJp || ""}
                            onChange={(e) =>
                              handleUpdateCategory(category.id, {
                                nameJp: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="グルメ"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleUpdateCategory(category.id, {
                            visible: !category.visible,
                          })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          category.visible
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {category.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 안내 메시지 */}
        {autoTranslate && (
          <div className="mt-8 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 자동 번역 활성화됨:</strong> 저장 시 입력한 한글
              카테고리명과 배지가 자동으로 영어와 일본어로 번역됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
