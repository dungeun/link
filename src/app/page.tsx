import { headers } from 'next/headers'
import HomePage from '@/components/HomePage'
import { 
  LanguageCode, 
  isLanguageCode
} from '@/types/global'
import { preloadHomePageData } from '@/lib/cache/preload-service'

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
  
  // 단일 통합 쿼리로 모든 데이터 프리로드 (N+1 문제 완전 해결)
  const preloadedData = await preloadHomePageData()
  
  console.log(`Page loaded in ${Date.now() - startTime}ms, cached: ${preloadedData.metadata.cached}`)

  // 클라이언트 컴포넌트에 모든 프리로드된 데이터 전달
  return <HomePage 
    initialSections={preloadedData.sections} 
    initialLanguage={initialLanguage}
    initialLanguagePacks={preloadedData.languagePacks}
    initialCampaigns={preloadedData.campaigns}
    initialCategoryStats={preloadedData.categoryStats}
    preloadMetadata={preloadedData.metadata}
  />
}

// 메타데이터 최적화
export const metadata = {
  title: 'REVU - 리뷰 플랫폼',
  description: '신뢰할 수 있는 리뷰 플랫폼',
  keywords: ['리뷰', '병원', '캠페인', '구매평'],
  openGraph: {
    title: 'REVU - 리뷰 플랫폼',
    description: '신뢰할 수 있는 리뷰 플랫폼',
    images: ['/og-image.png'],
  },
}