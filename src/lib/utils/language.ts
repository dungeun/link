import { NextRequest } from 'next/server'

export type SupportedLanguage = 'ko' | 'en' | 'jp'

/**
 * 요청에서 언어 감지
 */
export function detectLanguage(request: NextRequest): SupportedLanguage {
  // 1. URL 파라미터 체크
  const urlLang = request.nextUrl.searchParams.get('lang')
  if (urlLang && isSupported(urlLang)) {
    return urlLang as SupportedLanguage
  }

  // 2. Accept-Language 헤더 체크
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const languages = parseAcceptLanguage(acceptLanguage)
    for (const lang of languages) {
      const supported = mapToSupported(lang)
      if (supported) return supported
    }
  }

  // 3. Cookie 체크
  const cookieLang = request.cookies.get('language')?.value
  if (cookieLang && isSupported(cookieLang)) {
    return cookieLang as SupportedLanguage
  }

  // 4. 기본값
  return 'ko'
}

/**
 * Accept-Language 헤더 파싱
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map(lang => {
      const [code] = lang.trim().split(';')
      return code.toLowerCase().split('-')[0]
    })
    .filter(Boolean)
}

/**
 * 지원되는 언어인지 확인
 */
function isSupported(lang: string): boolean {
  return ['ko', 'en', 'jp'].includes(lang)
}

/**
 * 언어 코드를 지원되는 언어로 매핑
 */
function mapToSupported(lang: string): SupportedLanguage | null {
  const mapping: Record<string, SupportedLanguage> = {
    'ko': 'ko',
    'kr': 'ko',
    'korean': 'ko',
    'en': 'en',
    'us': 'en',
    'english': 'en',
    'ja': 'jp',
    'jp': 'jp',
    'japanese': 'jp',
  }
  
  return mapping[lang] || null
}

/**
 * 캠페인 데이터에서 언어별 필드 선택
 */
export function getTranslatedCampaignData(
  campaign: Record<string, unknown>,
  language: SupportedLanguage
) {
  // 번역 테이블이 있는 경우
  if (campaign.campaignTranslations && campaign.campaignTranslations.length > 0) {
    const translation = (campaign.campaignTranslations as Array<{ language: string; title?: string; description?: string; requirements?: string; hashtags?: string[] }>).find(
      (t) => t.language === language
    )
    
    if (translation) {
      return {
        ...campaign,
        title: translation.title || campaign.title,
        description: translation.description || campaign.description,
        requirements: translation.requirements || campaign.requirements,
        hashtags: translation.hashtags || campaign.hashtags,
      }
    }
  }

  // 기존 translations JSON 필드 체크 (하위 호환성)
  if (campaign.translations) {
    try {
      const translations = typeof campaign.translations === 'string' 
        ? JSON.parse(campaign.translations) 
        : campaign.translations
      
      if (translations[`title_${language}`]) {
        return {
          ...campaign,
          title: translations[`title_${language}`] || campaign.title,
          description: translations[`description_${language}`] || campaign.description,
          requirements: translations[`requirements_${language}`] || campaign.requirements,
          hashtags: translations[`hashtags_${language}`] || campaign.hashtags,
        }
      }
    } catch (e) {
      console.error('Failed to parse translations:', e)
    }
  }

  // 번역이 없으면 원본 반환
  return campaign
}

/**
 * 게시물 데이터에서 언어별 필드 선택
 */
export function getTranslatedPostData(
  post: Record<string, unknown>,
  language: SupportedLanguage
) {
  // 번역 테이블이 있는 경우
  if (post.postTranslations && post.postTranslations.length > 0) {
    const translation = (post.postTranslations as Array<{ language: string; title?: string; content?: string }>).find(
      (t) => t.language === language
    )
    
    if (translation) {
      return {
        ...post,
        title: translation.title || post.title,
        content: translation.content || post.content,
      }
    }
  }

  // 번역이 없으면 원본 반환
  return post
}