import { prisma } from '@/lib/db/prisma'

export interface SeoConfig {
  title: string
  description: string
  keywords: string
  author: string
  robots: string
  canonical: string
}

export interface MetadataConfig {
  favicon: string
  appleTouchIcon: string
  ogImage: string
  ogTitle: string
  ogDescription: string
  ogUrl: string
  ogSiteName: string
  ogType: string
  ogLocale: string
  twitterCard: string
  twitterSite: string
  twitterCreator: string
  twitterImage: string
  themeColor: string
  msapplicationTileColor: string
}

const defaultSeo: SeoConfig = {
  title: 'Revu - 리뷰 마케팅 플랫폼',
  description: '브랜드와 인플루언서를 연결하는 혁신적인 리뷰 마케팅 플랫폼입니다.',
  keywords: '리뷰, 인플루언서, 마케팅, 브랜드, 광고, 소셜미디어',
  author: 'Revu',
  robots: 'index, follow',
  canonical: 'https://revu.com'
}

const defaultMetadata: MetadataConfig = {
  favicon: '/favicon.svg',
  appleTouchIcon: '/apple-touch-icon.png',
  ogImage: '/og-image.svg',
  ogTitle: 'Revu - 리뷰 마케팅 플랫폼',
  ogDescription: '브랜드와 인플루언서를 연결하는 혁신적인 리뷰 마케팅 플랫폼입니다.',
  ogUrl: 'https://revu.com',
  ogSiteName: 'Revu',
  ogType: 'website',
  ogLocale: 'ko_KR',
  twitterCard: 'summary_large_image',
  twitterSite: '@revu',
  twitterCreator: '@revu',
  twitterImage: '/og-image.svg',
  themeColor: '#3B82F6',
  msapplicationTileColor: '#3B82F6'
}

export async function getSeoConfig(): Promise<SeoConfig> {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'seo' }
    })

    if (config) {
      try {
        return { ...defaultSeo, ...JSON.parse(config.value) }
      } catch (e) {
        return defaultSeo
      }
    }

    return defaultSeo
  } catch (error) {
    console.error('Error fetching SEO config:', error)
    return defaultSeo
  }
}

export async function getMetadataConfig(): Promise<MetadataConfig> {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { key: 'metadata' }
    })

    if (config) {
      try {
        return { ...defaultMetadata, ...JSON.parse(config.value) }
      } catch (e) {
        return defaultMetadata
      }
    }

    return defaultMetadata
  } catch (error) {
    console.error('Error fetching metadata config:', error)
    return defaultMetadata
  }
}

export async function getFullSeoConfig() {
  const [seo, metadata] = await Promise.all([
    getSeoConfig(),
    getMetadataConfig()
  ])

  return { seo, metadata }
}