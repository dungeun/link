"use client";

import { ReactNode, useMemo, memo } from "react";
import { useUIConfigStore } from "@/lib/stores/ui-config.store";

interface HomeSectionsProps {
  children: {
    hero?: ReactNode;
    category?: ReactNode;
    quicklinks?: ReactNode;
    promo?: ReactNode;
    ranking?: ReactNode;
    recommended?: ReactNode;
    activeCampaigns?: ReactNode;
    custom?: Record<string, ReactNode>;
  };
}

function HomeSectionsComponent({ children }: HomeSectionsProps) {
  const { config } = useUIConfigStore();

  // 기본 섹션 순서 - 메모이제이션
  const defaultSectionOrder = useMemo(
    () => [
      { id: "hero", type: "hero", order: 1, visible: true },
      { id: "category", type: "category", order: 2, visible: true },
      { id: "quicklinks", type: "quicklinks", order: 3, visible: true },
      { id: "promo", type: "promo", order: 4, visible: true },
      { id: "ranking", type: "ranking", order: 5, visible: true },
      { id: "recommended", type: "recommended", order: 6, visible: true },
      {
        id: "activeCampaigns",
        type: "activeCampaigns",
        order: 7,
        visible: true,
      },
    ],
    [],
  );

  // 섹션 순서 가져오기 - 메모이제이션
  const sectionOrder = useMemo(
    () => config.mainPage?.sectionOrder || defaultSectionOrder,
    [config.mainPage?.sectionOrder, defaultSectionOrder],
  );

  // 커스텀 섹션들도 순서에 추가 - 메모이제이션
  const customSectionOrders = useMemo(
    () =>
      (config.mainPage?.customSections || [])
        .filter((section) => section.visible)
        .map((section) => ({
          id: section.id,
          type: "custom" as const,
          order: section.order || 999,
          visible: section.visible,
        })),
    [config.mainPage?.customSections],
  );

  // 표시할 섹션만 필터링하고 순서대로 정렬 - 메모이제이션
  const visibleSections = useMemo(() => {
    const allSections = [...sectionOrder];
    customSectionOrders.forEach((customOrder) => {
      if (!allSections.find((s) => s.id === customOrder.id)) {
        allSections.push(customOrder);
      }
    });

    return allSections
      .filter((s) => s.visible)
      .sort((a, b) => a.order - b.order);
  }, [sectionOrder, customSectionOrders]);

  // 각 섹션 렌더링
  return (
    <>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return children.hero || null;
          case "category":
            return children.category || null;
          case "quicklinks":
            return children.quicklinks || null;
          case "promo":
            return children.promo || null;
          case "ranking":
            return children.ranking || null;
          case "recommended":
            return children.recommended || null;
          case "activeCampaigns":
            return children.activeCampaigns || null;
          case "custom":
            return children.custom?.[section.id] || null;
          default:
            return null;
        }
      })}
    </>
  );
}

// React.memo로 성능 최적화
export const HomeSections = memo(HomeSectionsComponent);
