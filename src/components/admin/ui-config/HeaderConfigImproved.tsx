"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import { useUIConfigStore } from "@/lib/stores/ui-config.store";
import type { MenuItem } from "@/lib/stores/ui-config.store";
import { SortableMenuItemImproved } from "./SortableMenuItemImproved";

export function HeaderConfigImproved() {
  const { config, updateHeaderMenus } = useUIConfigStore();
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 서버에서 최신 메뉴 데이터 로드
  const loadMenusFromServer = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/ui-sections?type=header");
      if (response.ok) {
        const data = await response.json();
        const menus = data.sections.map((section: any) => {
          const content = section.content ? JSON.parse(section.content) : {};
          return {
            id: `section-${section.id}`,
            label: content.name || content.label || section.sectionId, // content.name 우선 사용
            href: content.href || "#",
            order: section.order || 999,
            visible: section.visible,
          };
        });
        updateHeaderMenus(menus);
        console.log("메뉴 데이터 새로고침 완료:", menus);
      }
    } catch (error) {
      console.error("메뉴 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트시 서버에서 최신 데이터 로드
  useEffect(() => {
    loadMenusFromServer();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleHeaderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = config.header.menus.findIndex(
        (item) => item.id === String(active.id),
      );
      const newIndex = config.header.menus.findIndex(
        (item) => item.id === String(over.id),
      );

      const newMenus = arrayMove(config.header.menus, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          order: index + 1,
        }),
      );

      updateHeaderMenus(newMenus);
    }
  };

  const handleMenuUpdate = (id: string, updates: Partial<MenuItem>) => {
    const newMenus = config.header.menus.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    );
    updateHeaderMenus(newMenus);
  };

  const generateMenuKey = () => {
    // 기존 메뉴 키 중 header.menu.custom_XX 형식의 최대 번호 찾기
    const customMenus = config.header.menus
      .filter((menu) => menu.label.startsWith("header.menu.custom_"))
      .map((menu) => {
        const match = menu.label.match(/header\.menu\.custom_(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });

    const maxNumber = customMenus.length > 0 ? Math.max(...customMenus) : 0;
    return `header.menu.custom_${String(maxNumber + 1).padStart(2, "0")}`;
  };

  const generateSlugFromName = (name: string): string => {
    // 한글을 영어로 변환하는 기본 매핑
    const koreanToEnglish: Record<string, string> = {
      캠페인: "campaigns",
      병원: "hospitals",
      구매평: "reviews",
      이벤트: "events",
      상품: "products",
      문의: "contact",
      공지사항: "notices",
      고객센터: "support",
      서비스: "services",
      회사소개: "about",
    };

    // 한글인 경우 매핑된 값 사용, 없으면 기본 슬러그 생성
    if (koreanToEnglish[name]) {
      return `/${koreanToEnglish[name]}`;
    }

    // 영어인 경우 소문자로 변환하고 공백을 하이픈으로
    return `/${name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")}`;
  };

  const handleAddMenu = async () => {
    if (!newMenuName.trim()) {
      alert("메뉴 이름을 입력해주세요.");
      return;
    }

    // URL이 비어있으면 자동 생성
    const finalUrl = newMenuUrl.trim() || generateSlugFromName(newMenuName);

    try {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("auth-token");
      if (!token) {
        alert("인증이 필요합니다.");
        return;
      }

      // 1. 새로운 메뉴 키 생성
      const menuKey = generateMenuKey();

      // 2. 언어팩에 추가 (자동 번역 포함)
      let response = await fetch("/api/admin/language-packs/auto-translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: menuKey,
          ko: newMenuName,
          category: "header",
          autoTranslate: true, // 자동 번역 요청
        }),
      });

      // 자동 번역 실패시 간단한 버전 사용
      if (!response.ok) {
        console.warn("Auto-translate failed, trying simple version...");
        response = await fetch("/api/admin/language-packs/simple-create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            key: menuKey,
            ko: newMenuName,
            category: "header",
          }),
        });
      }

      if (!response.ok) {
        throw new Error("언어팩 추가 실패");
      }

      const languagePackData = await response.json();

      // 3. 메뉴 추가
      const newMenu: MenuItem = {
        id: `menu-${Date.now()}`,
        label: menuKey, // 언어팩 키 사용
        href: finalUrl,
        order: config.header.menus.length + 1,
        visible: true,
      };

      updateHeaderMenus([...config.header.menus, newMenu]);

      // 4. 입력 필드 초기화
      setNewMenuName("");
      setNewMenuUrl("");
      setIsAddingMenu(false);

      // 성공 메시지
      alert(
        `메뉴가 추가되었습니다.\n한국어: ${languagePackData.ko}\n영어: ${languagePackData.en}\n일본어: ${languagePackData.ja}`,
      );
    } catch (error) {
      console.error("메뉴 추가 실패:", error);
      alert("메뉴 추가 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteMenu = async (id: string) => {
    const menuToDelete = config.header.menus.find((m) => m.id === id);
    if (!menuToDelete) return;

    if (!confirm("이 메뉴를 삭제하시겠습니까?")) {
      return;
    }

    try {
      // 커스텀 메뉴인 경우 언어팩에서도 삭제
      if (menuToDelete.label.startsWith("header.menu.custom_")) {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("auth-token");
        if (token) {
          await fetch(`/api/admin/language-packs/${menuToDelete.label}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }

      updateHeaderMenus(config.header.menus.filter((item) => item.id !== id));
    } catch (error) {
      console.error("메뉴 삭제 실패:", error);
      alert("메뉴 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 메뉴 설정 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">헤더 메뉴 설정</h2>
          <div className="flex space-x-2">
            <button
              onClick={loadMenusFromServer}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="서버에서 최신 데이터 새로고침"
            >
              {isLoading ? "로딩..." : "새로고침"}
            </button>
            <button
              onClick={() => setIsAddingMenu(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              메뉴 추가
            </button>
          </div>
        </div>

        {/* 새 메뉴 추가 폼 */}
        {isAddingMenu && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-3">새 메뉴 추가</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메뉴 이름 (한국어)
                </label>
                <input
                  type="text"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 이벤트"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  링크 URL
                </label>
                <input
                  type="text"
                  value={newMenuUrl}
                  onChange={(e) => setNewMenuUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    newMenuName
                      ? `자동 생성: ${generateSlugFromName(newMenuName)}`
                      : "비워두면 자동 생성"
                  }
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleAddMenu}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setIsAddingMenu(false);
                    setNewMenuName("");
                    setNewMenuUrl("");
                  }}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                >
                  취소
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              * 메뉴 이름은 자동으로 영어와 일본어로 번역됩니다.
            </p>
          </div>
        )}

        {/* 기존 메뉴 목록 */}
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
            <div className="col-span-1"></div>
            <div className="col-span-3">메뉴 이름</div>
            <div className="col-span-3">언어팩 키</div>
            <div className="col-span-3">링크 URL</div>
            <div className="col-span-2 text-center">작업</div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleHeaderDragEnd}
          >
            <SortableContext
              items={config.header.menus}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {config.header.menus.map((menu) => (
                  <SortableMenuItemImproved
                    key={menu.id}
                    menu={menu}
                    onUpdate={handleMenuUpdate}
                    onDelete={handleDeleteMenu}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {config.header.menus.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            메뉴가 없습니다. 위의 &quot;메뉴 추가&quot; 버튼을 클릭하여 메뉴를
            추가하세요.
          </div>
        )}
      </div>
    </div>
  );
}
