import { Metadata } from "next";
import { getFullSeoConfig } from "@/lib/seo-config";

export async function generateMetadata(): Promise<Metadata> {
  const { seo, metadata } = await getFullSeoConfig();

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: seo.author }],
    robots: seo.robots,
    metadataBase: new URL(seo.canonical || "https://linkpick.com"),

    // Open Graph
    openGraph: {
      title: metadata.ogTitle,
      description: metadata.ogDescription,
      url: metadata.ogUrl,
      siteName: metadata.ogSiteName,
      type: metadata.ogType as any,
      locale: metadata.ogLocale,
      images: [
        {
          url: metadata.ogImage,
          width: 1200,
          height: 630,
          alt: metadata.ogTitle,
        },
      ],
    },

    // Twitter
    twitter: {
      card: metadata.twitterCard as any,
      site: metadata.twitterSite,
      creator: metadata.twitterCreator,
      title: metadata.ogTitle,
      description: metadata.ogDescription,
      images: [metadata.twitterImage],
    },

    // Icons
    icons: {
      icon: metadata.favicon,
      apple: metadata.appleTouchIcon,
    },

    // Theme
    themeColor: metadata.themeColor,

    // Other
    other: {
      "msapplication-TileColor": metadata.msapplicationTileColor,
    },
  };
}
