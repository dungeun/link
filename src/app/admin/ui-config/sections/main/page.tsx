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
} from "lucide-react";

interface MainPageSection {
  id: string;
  type: string;
  sectionId: string;
  title?: Record<string, string>;
  subtitle?: Record<string, string>;
  visible: boolean;
  order: number;
  content?: any;
}

const sectionTypes = [
  { value: "hero", label: "히어로 배너", description: "메인 배너 슬라이드" },
  {
    value: "category",
    label: "카테고리 메뉴",
    description: "카테고리 아이콘 그리드",
  },
  {
    value: "quicklinks",
    label: "바로가기 링크",
    description: "빠른 접근 링크",
  },
  { value: "promo", label: "프로모션 배너", description: "이벤트 및 공지" },
  { value: "ranking", label: "실시간 랭킹", description: "인기 콘텐츠 목록" },
  {
    value: "recommended",
    label: "추천 콘텐츠",
    description: "큐레이션된 콘텐츠",
  },
  { value: "cta", label: "CTA 섹션", description: "회원가입 유도" },
];

export default function MainPageSectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<MainPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ui-sections");

      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error("Error loading sections:", error);
      alert("섹션 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    const newSection: MainPageSection = {
      id: Date.now().toString(),
      type: "hero",
      sectionId: `section-${Date.now()}`,
      title: { ko: "새 섹션", en: "New Section", jp: "新しいセクション" },
      visible: true,
      order: sections.length + 1,
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (
    id: string,
    updates: Partial<MainPageSection>,
  ) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, ...updates } : section,
      ),
    );
  };

  const handleDeleteSection = (id: string) => {
    if (confirm("정말 이 섹션을 삭제하시겠습니까?")) {
      setSections(sections.filter((section) => section.id !== id));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [
      newSections[index],
      newSections[index - 1],
    ];

    // 순서 재정렬
    const reorderedSections = newSections.map((section, idx) => ({
      ...section,
      order: idx + 1,
    }));
    setSections(reorderedSections);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [
      newSections[index + 1],
      newSections[index],
    ];

    // 순서 재정렬
    const reorderedSections = newSections.map((section, idx) => ({
      ...section,
      order: idx + 1,
    }));
    setSections(reorderedSections);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 각 섹션 저장
      for (const section of sections) {
        const response = await fetch(
          `/api/admin/ui-sections/${section.sectionId || section.type}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: section.type,
              title: section.title,
              subtitle: section.subtitle,
              visible: section.visible,
              order: section.order,
              content: section.content,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to save section ${section.sectionId}`);
        }
      }

      alert("모든 섹션이 저장되었습니다.");
      router.push("/admin/ui-config?tab=sections");
    } catch (error) {
      console.error("Error saving sections:", error);
      alert("섹션 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getEditUrl = (section: MainPageSection) => {
    const typeMap: Record<string, string> = {
      hero: "/admin/ui-config/sections/hero",
      category: "/admin/ui-config/sections/category",
      quicklinks: "/admin/ui-config/sections/quicklinks",
      promo: "/admin/ui-config/sections/promo",
      ranking: "/admin/ui-config/sections/ranking",
      recommended: "/admin/ui-config/sections/recommended",
      cta: "/admin/ui-config/sections/cta",
    };
    return typeMap[section.type] || "#";
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
                  메인 페이지 섹션 관리
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  메인 페이지에 표시되는 섹션들을 관리합니다
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "저장 중..." : "모두 저장"}
              </button>
            </div>
          </div>
        </div>

        {/* 섹션 목록 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">활성 섹션</h2>
            <button
              onClick={handleAddSection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              섹션 추가
            </button>
          </div>

          <div className="space-y-4">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <div
                  key={section.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* 순서 조절 버튼 */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === sections.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            #{index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900">
                            {section.title?.ko ||
                              sectionTypes.find((t) => t.value === section.type)
                                ?.label ||
                              section.type}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              section.visible
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {section.visible ? "표시됨" : "숨김"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          타입:{" "}
                          {sectionTypes.find((t) => t.value === section.type)
                            ?.label || section.type}
                          {section.sectionId && ` | ID: ${section.sectionId}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleUpdateSection(section.id, {
                            visible: !section.visible,
                          })
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          section.visible
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {section.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => router.push(getEditUrl(section))}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        상세 편집
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 섹션 타입 변경 */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        섹션 타입
                      </label>
                      <select
                        value={section.type}
                        onChange={(e) =>
                          handleUpdateSection(section.id, {
                            type: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {sectionTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        섹션 ID
                      </label>
                      <input
                        type="text"
                        value={section.sectionId}
                        onChange={(e) =>
                          handleUpdateSection(section.id, {
                            sectionId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="section-id"
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {sections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>아직 추가된 섹션이 없습니다.</p>
              <p className="text-sm mt-2">
                위의 &quot;섹션 추가&quot; 버튼을 클릭하여 새 섹션을 추가하세요.
              </p>
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-8 bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 팁:</strong> 각 섹션의 순서를 드래그하여 변경할 수
            있으며, &quot;상세 편집&quot; 버튼을 클릭하여 섹션별 세부 설정을
            변경할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
