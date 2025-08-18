import { headers } from 'next/headers'
import HomePage from '@/components/HomePage'
import { 
  UISection, 
  LanguagePack, 
  LanguageCode, 
  isLanguageCode, 
  isJsonObject,
  UISectionContent 
} from '@/types/global'
import { getCachedSections } from '@/lib/cache/sections'
import { getCachedLanguagePacks } from '@/lib/cache/language-packs'

// 정적 생성으로 변경 + ISR 적용 (5분마다 갱신)
export const revalidate = 300

// 서버 컴포넌트로 변경 - 캐시된 데이터를 서버에서 미리 가져옴
export default async function Page() {
  // 서버에서 Accept-Language 헤더로 초기 언어 감지
  const headersList = headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  
  let initialLanguage: LanguageCode = 'ko'
  if (acceptLanguage.includes('en')) {
    initialLanguage = 'en'
  } else if (acceptLanguage.includes('ja') || acceptLanguage.includes('jp')) {
    initialLanguage = 'jp'
  }
  
  // 병렬로 캐시된 데이터 가져오기 (Promise.all 사용)
  const [sections, languagePacks] = await Promise.all([
    getCachedSections(),
    getCachedLanguagePacks()
  ])

  // 클라이언트 컴포넌트에 데이터 전달
  return <HomePage 
    initialSections={sections} 
    initialLanguage={initialLanguage}
    initialLanguagePacks={languagePacks}
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