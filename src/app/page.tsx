import { headers } from 'next/headers'
import HomePage from '@/components/HomePage'
import { 
  LanguageCode, 
  isLanguageCode
} from '@/types/global'
import { homepageManager } from '@/lib/cache/homepage-manager'
import { loadStaticUITexts } from '@/lib/cache/json-loader'
import { getSeoConfig } from '@/lib/seo-config'
import { prisma } from '@/lib/db/prisma'
import type { Metadata } from 'next'

// 검색엔진 수준 최적화: 정적 생성 + ISR (10분마다 갱신)
export const revalidate = 600

// 서버 컴포넌트 - 모든 필요 데이터를 미리 프리로드
export default async function Page() {
  const startTime = Date.now()
  
  // 서버에서 Accept-Language 헤더로 초기 언어 감지
  const headersList = headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  
  let initialLanguage: LanguageCode = 'ko'
  if (acceptLanguage.includes('en')) {
    initialLanguage = 'en'
  } else if (acceptLanguage.includes('ja') || acceptLanguage.includes('jp')) {
    initialLanguage = 'jp'
  }
  
  // 데이터베이스 → JSON 동기화 (관리자 수정사항 반영)
  await homepageManager.syncFromDatabase()
  
  // JSON-first 홈페이지 데이터 로드 (10초 → 1초 목표)
  const [sectionsData, staticTexts] = await Promise.all([
    homepageManager.getSectionsByLanguage(initialLanguage),
    loadStaticUITexts(initialLanguage)
  ])
  
  console.log(`Page loaded in ${Date.now() - startTime}ms, JSON-first: ${sectionsData.length} sections`)

  // 클라이언트 컴포넌트에 JSON 데이터 전달
  return <HomePage 
    initialSections={sectionsData} 
    initialLanguage={initialLanguage}
    staticUITexts={staticTexts}
    preloadMetadata={{
      cached: true,
      loadTime: Date.now() - startTime,
      source: 'json-first'
    }}
  />
}

// 동적 메타데이터 생성
export async function generateMetadata(): Promise<Metadata> {
  try {
    // 사이트 설정 불러오기
    const siteSettings = await prisma.siteConfig.findFirst({
      where: { key: 'site_title' }
    })
    
    // SEO 설정 불러오기
    const seoConfig = await getSeoConfig()
    
    // 동적 title과 description 생성
    const siteName = siteSettings?.value || seoConfig.title || 'LinkPick'
    const siteDescription = seoConfig.description || '브랜드와 인플루언서를 연결하는 마케팅 플랫폼'
    
    // SEO 설정에서 메타 제목을 가져오거나 기본값 생성
    const title = seoConfig.title || `${siteName} - 인플루언서 마케팅 플랫폼`
    
    // 웹사이트 SEO 설정에서 메타데이터 정보 가져오기
    const metaDescription = siteDescription
    const metaKeywords = seoConfig.keywords || '인플루언서, 마케팅, 브랜드, 광고, 소셜미디어'
    const ogImage = '/og-image.png'
    const ogTitle = title
    const ogDescription = metaDescription

    return {
      title,
      description: metaDescription,
      keywords: metaKeywords.split(',').map(k => k.trim()),
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        siteName: siteName,
        url: seoConfig.canonical,
        images: [ogImage],
        type: 'website',
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [ogImage],
        site: '@linkpick_kr',
        creator: '@linkpick_kr',
      },
      robots: seoConfig.robots || 'index, follow',
      authors: [{ name: seoConfig.author || siteName }],
      other: {
        'theme-color': '#3B82F6',
        'msapplication-TileColor': '#3B82F6',
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    
    // 폴백 메타데이터
    return {
      title: 'LinkPick - 인플루언서 마케팅 플랫폼',
      description: '브랜드와 인플루언서를 연결하는 마케팅 플랫폼',
      keywords: ['인플루언서', '마케팅', '브랜드', '광고', '소셜미디어'],
      openGraph: {
        title: 'LinkPick - 인플루언서 마케팅 플랫폼',
        description: '브랜드와 인플루언서를 연결하는 마케팅 플랫폼',
        images: ['/og-image.png'],
      },
    }
  }
}