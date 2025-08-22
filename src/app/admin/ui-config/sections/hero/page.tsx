"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Save,
  Globe,
  RefreshCw,
} from "lucide-react";

interface HeroSlide {
  id: string;
  title: string;
  titleEn?: string;
  titleJp?: string;
  subtitle: string;
  subtitleEn?: string;
  subtitleJp?: string;
  tag?: string;
  tagEn?: string;
  tagJp?: string;
  link?: string;
  bgColor: string;
  backgroundImage?: string;
  visible: boolean;
  order: number;
  useFullImage?: boolean;
  fullImageUrl?: string;
  fullImageUrlEn?: string;
  fullImageUrlJp?: string;
  fullImageWidth?: number;
  fullImageHeight?: number;
}

export default function HeroSectionEditPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [translating, setTranslating] = useState(false);

  // DB에서 데이터 로드
  useEffect(() => {
    loadSection();
  }, []);

  const loadSection = async () => {
    try {
      setLoading(true);
      // JSON 파일에서 직접 로드
      const response = await fetch("/cache/homepage-unified.json");

      if (response.ok) {
        const data = await response.json();
        if (data.sections?.hero) {
          const heroSection = data.sections.hero;
          // JSON 데이터를 Admin 형식으로 변환
          if (heroSection.data?.slides) {
            const convertedSlides = heroSection.data.slides.map(
              (slide: any) => ({
                id: slide.id,
                title: slide.title?.ko || slide.title || "",
                titleEn: slide.title?.en || "",
                titleJp: slide.title?.jp || "",
                subtitle: slide.subtitle?.ko || slide.subtitle || "",
                subtitleEn: slide.subtitle?.en || "",
                subtitleJp: slide.subtitle?.jp || "",
                tag: slide.tag?.ko || slide.tag || "",
                tagEn: slide.tag?.en || "",
                tagJp: slide.tag?.jp || "",
                link: slide.link || "",
                bgColor:
                  slide.bgColor ||
                  "bg-gradient-to-br from-blue-600 to-cyan-600",
                backgroundImage: slide.backgroundImage || null,
                visible: slide.visible !== false,
                order: slide.order || 1,
                useFullImage: slide.useFullImage || false,
                fullImageUrl: slide.fullImageUrl || "",
                fullImageUrlEn: slide.fullImageUrlEn || "",
                fullImageUrlJp: slide.fullImageUrlJp || "",
                fullImageWidth: slide.fullImageWidth || 0,
                fullImageHeight: slide.fullImageHeight || 0,
              }),
            );
            setSlides(convertedSlides);
          }
          setSectionVisible(heroSection.visible !== false);
        }
      } else {
        console.error("Failed to load section");
      }
    } catch (error) {
      console.error("Error loading section:", error);
      alert("섹션 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: Date.now().toString(),
      title: "새 슬라이드",
      subtitle: "부제목을 입력하세요",
      tag: "NEW",
      bgColor: "bg-gradient-to-br from-blue-600 to-cyan-600",
      visible: true,
      order: slides.length + 1,
    };
    setSlides([...slides, newSlide]);
  };

  const handleUpdateSlide = (id: string, updates: Partial<HeroSlide>) => {
    setSlides(
      slides.map((slide) =>
        slide.id === id ? { ...slide, ...updates } : slide,
      ),
    );
  };

  const handleImageUpload = async (slideId: string, file: File) => {
    // 이미지 업로드 로직
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleUpdateSlide(slideId, { backgroundImage: data.url });
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  const handleFullImageUpload = async (
    slideId: string,
    file: File,
    lang: "ko" | "en" | "jp" = "ko",
  ) => {
    // 전체 이미지 업로드 로직
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        // 이미지 크기 정보 가져오기
        const img = new Image();
        img.onload = () => {
          if (lang === "ko") {
            handleUpdateSlide(slideId, {
              fullImageUrl: data.url,
              fullImageWidth: img.width,
              fullImageHeight: img.height,
            });
          } else if (lang === "en") {
            handleUpdateSlide(slideId, {
              fullImageUrlEn: data.url,
            });
          } else if (lang === "jp") {
            handleUpdateSlide(slideId, {
              fullImageUrlJp: data.url,
            });
          }
        };
        img.src = data.url;
      }
    } catch (error) {
      console.error("Full image upload failed:", error);
      alert("전체 이미지 업로드에 실패했습니다.");
    }
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      alert("최소 1개의 슬라이드는 필요합니다.");
      return;
    }

    if (confirm("이 슬라이드를 삭제하시겠습니까?")) {
      setSlides(slides.filter((slide) => slide.id !== id));
    }
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
      // 모든 슬라이드 번역
      const translatedSlides = await Promise.all(
        slides.map(async (slide) => {
          const response = await fetch("/admin/translations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              texts: {
                title: slide.title,
                subtitle: slide.subtitle,
                tag: slide.tag,
              },
              targetLanguages: ["en", "jp"],
            }),
          });

          if (!response.ok) {
            throw new Error("번역 실패");
          }

          const translated = await response.json();

          return {
            ...slide,
            titleEn: translated.title?.en || slide.titleEn,
            titleJp: translated.title?.jp || slide.titleJp,
            subtitleEn: translated.subtitle?.en || slide.subtitleEn,
            subtitleJp: translated.subtitle?.jp || slide.subtitleJp,
            tagEn: translated.tag?.en || slide.tagEn,
            tagJp: translated.tag?.jp || slide.tagJp,
          };
        }),
      );

      setSlides(translatedSlides);
      alert("번역이 완료되었습니다.");
    } catch (error) {
      console.error("Translation error:", error);
      alert("번역 중 오류가 발생했습니다.");
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // 자동 번역이 활성화되어 있고 영어/일본어 번역이 비어있으면 먼저 번역
    if (autoTranslate) {
      const needsTranslation = slides.some(
        (slide) =>
          !slide.titleEn ||
          !slide.titleJp ||
          !slide.subtitleEn ||
          !slide.subtitleJp,
      );

      if (needsTranslation) {
        alert("번역 중입니다. 잠시만 기다려주세요...");
        await handleAutoTranslate();
      }
    }

    try {
      // JSON 형식으로 변환 (다국어 지원)
      const convertedSlides = slides.map((slide) => ({
        id: slide.id,
        title: {
          ko: slide.title,
          en: slide.titleEn || slide.title,
          jp: slide.titleJp || slide.title,
        },
        subtitle: {
          ko: slide.subtitle,
          en: slide.subtitleEn || slide.subtitle,
          jp: slide.subtitleJp || slide.subtitle,
        },
        tag: slide.tag
          ? {
              ko: slide.tag,
              en: slide.tagEn || slide.tag,
              jp: slide.tagJp || slide.tag,
            }
          : slide.tag,
        link: slide.link,
        bgColor: slide.bgColor,
        backgroundImage: slide.backgroundImage,
        visible: slide.visible,
        order: slide.order,
        useFullImage: slide.useFullImage,
        fullImageUrl: slide.fullImageUrl,
        fullImageUrlEn: slide.fullImageUrlEn,
        fullImageUrlJp: slide.fullImageUrlJp,
        fullImageWidth: slide.fullImageWidth,
        fullImageHeight: slide.fullImageHeight,
      }));

      const response = await fetch("/api/admin/sections-to-json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: "hero",
          data: {
            slides: convertedSlides,
          },
          visible: sectionVisible,
        }),
      });

      if (response.ok) {
        alert("저장되었습니다.");
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

  const presetColors = [
    {
      name: "인디고-퍼플",
      value: "bg-gradient-to-br from-indigo-600 to-purple-600",
    },
    { name: "핑크-로즈", value: "bg-gradient-to-br from-pink-500 to-rose-500" },
    { name: "블루-시안", value: "bg-gradient-to-br from-blue-600 to-cyan-600" },
    {
      name: "그린-틸",
      value: "bg-gradient-to-br from-emerald-500 to-teal-600",
    },
    {
      name: "오렌지-레드",
      value: "bg-gradient-to-br from-orange-500 to-red-600",
    },
    {
      name: "퍼플-핑크",
      value: "bg-gradient-to-br from-purple-600 to-pink-600",
    },
  ];

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
                  히어로 배너 관리
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  메인 페이지 상단 배너 슬라이드를 관리합니다
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
                  {sectionVisible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
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

        {/* 슬라이드 목록 */}
        <div className="space-y-6">
          {slides.map((slide, index) => (
            <div key={slide.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  슬라이드 {index + 1}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateSlide(slide.id, { visible: !slide.visible })
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      slide.visible
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {slide.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 (한국어)
                    </label>
                    <textarea
                      value={slide.title}
                      onChange={(e) =>
                        handleUpdateSlide(slide.id, { title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="슬라이드 제목을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 (영어)
                    </label>
                    <textarea
                      value={slide.titleEn || ""}
                      onChange={(e) =>
                        handleUpdateSlide(slide.id, { titleEn: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Enter slide title in English"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 (일본어)
                    </label>
                    <textarea
                      value={slide.titleJp || ""}
                      onChange={(e) =>
                        handleUpdateSlide(slide.id, { titleJp: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="スライドのタイトルを入力してください"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      부제목 (한국어)
                    </label>
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={(e) =>
                        handleUpdateSlide(slide.id, {
                          subtitle: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="슬라이드 부제목을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      부제목 (영어)
                    </label>
                    <input
                      type="text"
                      value={slide.subtitleEn || ""}
                      onChange={(e) =>
                        handleUpdateSlide(slide.id, {
                          subtitleEn: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter slide subtitle in English"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      부제목 (일본어)
                    </label>
                    <input
                      type="text"
                      value={slide.subtitleJp || ""}
                      onChange={(e) =>
                        handleUpdateSlide(slide.id, {
                          subtitleJp: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="スライドのサブタイトルを入力してください"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        태그 (한국어)
                      </label>
                      <input
                        type="text"
                        value={slide.tag || ""}
                        onChange={(e) =>
                          handleUpdateSlide(slide.id, { tag: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="예: 🎯 신규"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        태그 (영어)
                      </label>
                      <input
                        type="text"
                        value={slide.tagEn || ""}
                        onChange={(e) =>
                          handleUpdateSlide(slide.id, { tagEn: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g. 🎯 NEW"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        태그 (일본어)
                      </label>
                      <input
                        type="text"
                        value={slide.tagJp || ""}
                        onChange={(e) =>
                          handleUpdateSlide(slide.id, { tagJp: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例: 🎯 新規"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        링크
                      </label>
                      <input
                        type="text"
                        value={slide.link || ""}
                        onChange={(e) =>
                          handleUpdateSlide(slide.id, { link: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="/campaigns"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 전체 이미지 사용 체크박스 */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slide.useFullImage || false}
                        onChange={(e) =>
                          handleUpdateSlide(slide.id, {
                            useFullImage: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        전체 이미지로 표시
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      체크 시 그리드 1개가 전체 이미지로 대체됩니다
                    </p>
                  </div>

                  {!slide.useFullImage ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          배경 색상
                        </label>
                        <select
                          value={slide.bgColor}
                          onChange={(e) =>
                            handleUpdateSlide(slide.id, {
                              bgColor: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {presetColors.map((color) => (
                            <option key={color.value} value={color.value}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          배경 이미지
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(slide.id, file);
                            }}
                            className="hidden"
                            id={`image-${slide.id}`}
                          />
                          <label
                            htmlFor={`image-${slide.id}`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            이미지 업로드
                          </label>
                          {slide.backgroundImage && (
                            <span className="text-sm text-gray-600">
                              이미지 업로드됨
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        전체 이미지 (언어별)
                      </label>
                      <div className="space-y-4">
                        {/* 한국어 이미지 */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              🇰🇷 한국어 이미지
                            </span>
                            {slide.fullImageUrl && (
                              <span className="text-xs text-green-600">
                                ✓ 업로드됨
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                handleFullImageUpload(slide.id, file, "ko");
                            }}
                            className="hidden"
                            id={`full-image-ko-${slide.id}`}
                          />
                          <label
                            htmlFor={`full-image-ko-${slide.id}`}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            한국어 이미지 업로드
                          </label>
                        </div>

                        {/* 영어 이미지 */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              🇺🇸 영어 이미지
                            </span>
                            {slide.fullImageUrlEn && (
                              <span className="text-xs text-green-600">
                                ✓ 업로드됨
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                handleFullImageUpload(slide.id, file, "en");
                            }}
                            className="hidden"
                            id={`full-image-en-${slide.id}`}
                          />
                          <label
                            htmlFor={`full-image-en-${slide.id}`}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            영어 이미지 업로드
                          </label>
                        </div>

                        {/* 일본어 이미지 */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              🇯🇵 일본어 이미지
                            </span>
                            {slide.fullImageUrlJp && (
                              <span className="text-xs text-green-600">
                                ✓ 업로드됨
                              </span>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                handleFullImageUpload(slide.id, file, "jp");
                            }}
                            className="hidden"
                            id={`full-image-jp-${slide.id}`}
                          />
                          <label
                            htmlFor={`full-image-jp-${slide.id}`}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            일본어 이미지 업로드
                          </label>
                        </div>

                        {slide.fullImageUrl &&
                          slide.fullImageWidth &&
                          slide.fullImageHeight && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <strong>이미지 정보:</strong>{" "}
                              {slide.fullImageWidth} × {slide.fullImageHeight}px
                              <br />
                              <strong>권장 크기:</strong> 1200 × 600px 이상 (2:1
                              비율)
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* 미리보기 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      미리보기
                    </label>
                    {slide.useFullImage ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center">
                        {slide.fullImageUrl ? (
                          <div
                            className="w-full h-full rounded-lg flex items-center justify-center relative overflow-hidden"
                            style={{
                              backgroundImage: `url(${slide.fullImageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          >
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="text-white text-center">
                                <h4 className="text-sm font-bold">
                                  {slide.title}
                                </h4>
                                <p className="text-xs opacity-90">
                                  {slide.subtitle}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500">
                            <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">전체 이미지 모드</p>
                            <p className="text-xs">이미지를 업로드해주세요</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`${slide.bgColor} text-white p-4 rounded-lg h-32 flex flex-col justify-center`}
                        style={{
                          backgroundImage: slide.backgroundImage
                            ? `url(${slide.backgroundImage})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div
                          className={
                            slide.backgroundImage
                              ? "bg-black/30 p-2 rounded"
                              : ""
                          }
                        >
                          {slide.tag && (
                            <span className="inline-block bg-white/20 backdrop-blur px-2 py-1 rounded-full text-xs font-medium mb-1">
                              {slide.tag}
                            </span>
                          )}
                          <h4 className="text-lg font-bold whitespace-pre-line">
                            {slide.title}
                          </h4>
                          <p className="text-sm opacity-90">{slide.subtitle}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 슬라이드 추가 버튼 */}
        <button
          onClick={handleAddSlide}
          className="w-full bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <Plus className="w-5 h-5" />새 슬라이드 추가
        </button>

        {/* 안내 메시지 */}
        {autoTranslate && (
          <div className="mt-8 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 자동 번역 활성화됨:</strong> 저장 시 입력한 한글 내용이
              자동으로 영어와 일본어로 번역됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
