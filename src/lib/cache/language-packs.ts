import { prisma } from '@/lib/db/prisma'
import { LanguagePack } from '@/types/global'

// 메모리 캐시
let cachedLanguagePacks: Record<string, LanguagePack> | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 10 * 60 * 1000 // 10분 (언어팩은 자주 변경되지 않음)

export async function getCachedLanguagePacks(): Promise<Record<string, LanguagePack>> {
  const now = Date.now()
  
  // 캐시가 유효한 경우 바로 반환
  if (cachedLanguagePacks && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedLanguagePacks
  }
  
  try {
    // DB에서 언어팩 데이터 가져오기 (타임아웃 3초)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Language pack timeout')), 3000)
    })
    
    const packsPromise = prisma.languagePack.findMany({
      // 필요한 필드만 선택
      select: {
        id: true,
        key: true,
        ko: true,
        en: true,
        jp: true,
        category: true,
        description: true
      }
    })
    
    const packs = await Promise.race([packsPromise, timeoutPromise]) as any[]
    
    // 키-값 형태로 변환
    const languagePacks = packs.reduce((acc, pack) => {
      acc[pack.key] = {
        id: pack.id,
        key: pack.key,
        ko: pack.ko,
        en: pack.en,
        jp: pack.jp,
        category: pack.category || undefined,
        description: pack.description || undefined
      }
      return acc
    }, {} as Record<string, LanguagePack>)
    
    // 캐시 업데이트
    cachedLanguagePacks = languagePacks
    cacheTimestamp = now
    
    return languagePacks
    
  } catch (error) {
    console.error('Failed to load language packs:', error)
    
    // DB 실패 시 빈 객체 반환
    const fallbackPacks: Record<string, LanguagePack> = {}
    
    // 실패한 경우에도 캐시하여 반복 요청 방지 (2분간)
    if (!cachedLanguagePacks) {
      cachedLanguagePacks = fallbackPacks
      cacheTimestamp = now - CACHE_TTL + 120000 // 2분 후 다시 시도
    }
    
    return cachedLanguagePacks
  }
}

// 캐시 무효화 함수 (관리자에서 언어팩 업데이트 시 사용)
export function invalidateLanguagePacksCache(): void {
  cachedLanguagePacks = null
  cacheTimestamp = 0
}