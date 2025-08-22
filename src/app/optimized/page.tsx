import { headers } from "next/headers";
import OptimizedHomePage from "@/components/OptimizedHomePage";
import { LanguageCode, isLanguageCode } from "@/types/global";
import { getSeoConfig } from "@/lib/seo-config";
import { prisma } from "@/lib/db/prisma";
import { preloadHomePageData } from "@/lib/cache/preload-service";
import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";

// 검색엔진 수준 최적화: 정적 생성 + ISR (10분마다 갱신)
export const revalidate = 600;

// 서버 컴포넌트 - 모든 필요 데이터를 프리로드
export default async function OptimizedPage() {
  const startTime = Date.now();

  // 서버에서 Accept-Language 헤더로 초기 언어 감지
  const headersList = headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  let initialLanguage: LanguageCode = "ko";
  if (acceptLanguage.includes("en")) {
    initialLanguage = "en";
  } else if (acceptLanguage.includes("ja") || acceptLanguage.includes("jp")) {
    initialLanguage = "jp";
  }

  // preloadHomePageData를 사용하여 모든 데이터 한번에 가져오기
  const preloadedData = await preloadHomePageData();

  const loadTime = Date.now() - startTime;
  console.log(
    `🚀 Optimized page loaded in ${loadTime}ms (cache: ${preloadedData.metadata.cached})`,
  );

  // 최적화된 HomePage에 프리로드된 데이터 전달
  // 언어팩은 정적 import를 사용하므로 제외
  return (
    <OptimizedHomePage
      initialSections={preloadedData.sections}
      initialLanguage={initialLanguage}
      initialCampaigns={preloadedData.campaigns}
      initialCategoryStats={preloadedData.categoryStats}
      preloadMetadata={preloadedData.metadata}
    />
  );
}

// 동적 메타데이터 생성 (기존과 동일)
export async function generateMetadata(): Promise<Metadata> {
  try {
    const siteSettings = await prisma.siteConfig.findFirst({
      where: { key: "site_title" },
    });

    const seoConfig = await getSeoConfig();

    const siteName = siteSettings?.value || seoConfig.title || "LinkPick";
    const siteDescription =
      seoConfig.description || "브랜드와 인플루언서를 연결하는 마케팅 플랫폼";

    const title = seoConfig.title || `${siteName} - 인플루언서 마케팅 플랫폼`;
    const metaDescription = siteDescription;
    const metaKeywords =
      seoConfig.keywords || "인플루언서, 마케팅, 브랜드, 광고, 소셜미디어";
    const ogImage = "/og-image.png";
    const ogTitle = title;
    const ogDescription = metaDescription;

    return {
      title,
      description: metaDescription,
      keywords: metaKeywords.split(",").map((k) => k.trim()),
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        siteName: siteName,
        url: seoConfig.canonical,
        images: [ogImage],
        type: "website",
        locale: "ko_KR",
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: [ogImage],
        site: "@linkpick_kr",
        creator: "@linkpick_kr",
      },
      robots: seoConfig.robots || "index, follow",
      authors: [{ name: seoConfig.author || siteName }],
      other: {
        "theme-color": "#3B82F6",
        "msapplication-TileColor": "#3B82F6",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);

    return {
      title: "LinkPick - 인플루언서 마케팅 플랫폼",
      description: "브랜드와 인플루언서를 연결하는 마케팅 플랫폼",
      keywords: ["인플루언서", "마케팅", "브랜드", "광고", "소셜미디어"],
      openGraph: {
        title: "LinkPick - 인플루언서 마케팅 플랫폼",
        description: "브랜드와 인플루언서를 연결하는 마케팅 플랫폼",
        images: ["/og-image.png"],
      },
    };
  }
}
