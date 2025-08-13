import { headers } from 'next/headers'
import HomePage from '@/components/HomePage'
import { prisma } from '@/lib/db/prisma'

// 서버 컴포넌트로 변경 - 데이터를 서버에서 미리 가져옴
export default async function Page() {
  // 서버에서 Accept-Language 헤더로 초기 언어 감지
  const headersList = headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  
  let initialLanguage = 'ko'
  if (acceptLanguage.includes('en')) {
    initialLanguage = 'en'
  } else if (acceptLanguage.includes('ja') || acceptLanguage.includes('jp')) {
    initialLanguage = 'jp'
  }
  
  // 서버에서 섹션 데이터 미리 가져오기
  let sections = []
  
  try {
    const dbSections = await prisma.uISection.findMany({
      where: { 
        visible: true,
        type: { in: ['hero', 'category', 'quicklinks', 'promo'] }
      },
      orderBy: { order: 'asc' }
    })
    
    sections = dbSections.map(section => ({
      id: section.id,
      type: section.type,
      sectionId: section.sectionId,
      title: section.title,
      subtitle: section.subtitle,
      content: section.content as any,
      translations: section.translations as any,
      visible: section.visible,
      order: section.order
    }))
  } catch (error) {
    console.error('Failed to load sections from DB:', error)
  }

  // 언어팩 데이터도 서버에서 미리 가져오기
  let languagePacks = {}
  try {
    const packs = await prisma.languagePack.findMany()
    languagePacks = packs.reduce((acc, pack) => {
      acc[pack.key] = {
        id: pack.id,
        key: pack.key,
        ko: pack.ko,
        en: pack.en,
        jp: pack.jp,
        category: pack.category,
        description: pack.description
      }
      return acc
    }, {} as Record<string, any>)
  } catch (error) {
    console.error('Failed to load language packs:', error)
  }

  // 클라이언트 컴포넌트에 데이터 전달
  return <HomePage 
    initialSections={sections} 
    initialLanguage={initialLanguage}
    initialLanguagePacks={languagePacks}
  />
}