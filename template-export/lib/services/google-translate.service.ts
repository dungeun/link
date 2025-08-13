interface TranslationResult {
  text: string
  source: string
  target: string
  confidence: number
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}

export class GoogleTranslateService {
  private apiKey: string
  private baseUrl = 'https://translation.googleapis.com/language/translate/v2'

  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Google Translate API key not configured')
    }
  }

  /**
   * 데이터베이스에서 API 키 로드
   */
  private async loadApiKeyFromDB(): Promise<string> {
    try {
      const { prisma } = await import('@/lib/db/prisma')
      const config = await prisma.siteConfig.findUnique({
        where: { key: 'google_translate_api_key' }
      })
      return config?.value || process.env.GOOGLE_TRANSLATE_API_KEY || ''
    } catch (error) {
      console.error('DB에서 API 키 로드 실패:', error)
      return process.env.GOOGLE_TRANSLATE_API_KEY || ''
    }
  }

  /**
   * 현재 API 키 가져오기 (DB 우선, 환경변수 fallback)
   */
  private async getApiKey(): Promise<string> {
    // testMode에서는 환경변수에서 직접 가져오기 (임시 키가 설정된 상태)
    if (process.env.NODE_ENV === 'development' && process.env.GOOGLE_TRANSLATE_API_KEY) {
      console.log('[Google Translate] 환경변수에서 API 키 사용:', process.env.GOOGLE_TRANSLATE_API_KEY ? '설정됨' : '없음')
      return process.env.GOOGLE_TRANSLATE_API_KEY || ''
    }
    
    if (!this.apiKey) {
      this.apiKey = await this.loadApiKeyFromDB()
      console.log('[Google Translate] DB에서 API 키 로드:', this.apiKey ? '성공' : '실패')
    }
    return this.apiKey
  }

  /**
   * 텍스트를 지정된 언어로 번역
   */
  async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage: string = 'ko'
  ): Promise<TranslationResult | null> {
    const apiKey = await this.getApiKey()
    if (!apiKey) {
      throw new Error('Google Translate API key not configured')
    }

    if (!text.trim()) {
      throw new Error('번역할 텍스트가 없습니다')
    }

    try {
      console.log('[Google Translate] 번역 요청 시작:', {
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        sourceLanguage,
        targetLanguage,
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'none'
      })

      const requestBody = {
        q: text,
        source: sourceLanguage,
        target: targetLanguage,
        format: 'text'
      }

      console.log('[Google Translate] 요청 본문:', requestBody)

      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('[Google Translate] 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Google Translate] API 오류 응답:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        })
        
        let errorMessage = `번역 요청 실패: ${response.status} ${response.statusText}`
        
        if (response.status === 400) {
          errorMessage = 'API 키가 유효하지 않거나 요청 형식이 잘못되었습니다.'
        } else if (response.status === 403) {
          errorMessage = 'API 키에 Translation API 사용 권한이 없습니다.'
        } else if (response.status === 429) {
          errorMessage = 'API 사용량 한도를 초과했습니다.'
        }
        
        throw new Error(errorMessage)
      }

      const result: GoogleTranslateResponse = await response.json()
      
      console.log('[Google Translate] API 응답:', result)
      
      if (!result.data?.translations?.length) {
        console.error('[Google Translate] 번역 결과가 없음:', result)
        throw new Error('번역 결과를 받을 수 없습니다')
      }

      const translation = result.data.translations[0]
      
      const translationResult = {
        text: translation.translatedText,
        source: translation.detectedSourceLanguage || sourceLanguage,
        target: targetLanguage,
        confidence: 0.9 // Google API는 신뢰도를 제공하지 않으므로 기본값
      }
      
      console.log('[Google Translate] 번역 성공:', translationResult)
      
      return translationResult
    } catch (error) {
      console.error('[Google Translate] 번역 오류:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  /**
   * 여러 텍스트를 일괄 번역
   */
  async translateBatch(
    texts: string[], 
    targetLanguage: string, 
    sourceLanguage: string = 'ko'
  ): Promise<TranslationResult[]> {
    const apiKey = await this.getApiKey()
    if (!apiKey) {
      throw new Error('Google Translate API key not configured')
    }

    if (!texts.length) {
      return []
    }

    // 빈 텍스트 필터링
    const nonEmptyTexts = texts.filter(text => text.trim())
    if (!nonEmptyTexts.length) {
      return []
    }

    try {
      const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: nonEmptyTexts,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Google Translate API error:', errorText)
        throw new Error(`번역 요청 실패: ${response.status} ${response.statusText}`)
      }

      const result: GoogleTranslateResponse = await response.json()
      
      if (!result.data?.translations?.length) {
        throw new Error('번역 결과를 받을 수 없습니다')
      }

      return result.data.translations.map((translation, index) => ({
        text: translation.translatedText,
        source: translation.detectedSourceLanguage || sourceLanguage,
        target: targetLanguage,
        confidence: 0.9
      }))
    } catch (error) {
      console.error('Batch translation error:', error)
      throw error
    }
  }

  /**
   * 지원 언어 목록
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'ko', name: '한국어' },
      { code: 'en', name: '영어' },
      { code: 'jp', name: '일본어' },
      { code: 'zh', name: '중국어' },
      { code: 'es', name: '스페인어' },
      { code: 'fr', name: '프랑스어' },
      { code: 'de', name: '독일어' },
      { code: 'it', name: '이탈리아어' },
      { code: 'pt', name: '포르투갈어' },
      { code: 'ru', name: '러시아어' },
      { code: 'ar', name: '아랍어' },
      { code: 'hi', name: '힌디어' },
      { code: 'th', name: '태국어' },
      { code: 'vi', name: '베트남어' }
    ]
  }

  /**
   * API 키 유효성 검사
   */
  async validateApiKey(): Promise<boolean> {
    const apiKey = await this.getApiKey()
    if (!apiKey) {
      return false
    }

    try {
      const result = await this.translateText('Hello', 'ko', 'en')
      return !!result
    } catch (error) {
      console.error('API key validation failed:', error)
      return false
    }
  }

  /**
   * 언어 감지
   */
  async detectLanguage(text: string): Promise<string | null> {
    const apiKey = await this.getApiKey()
    if (!apiKey) {
      throw new Error('Google Translate API key not configured')
    }

    if (!text.trim()) {
      return null
    }

    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      })

      if (!response.ok) {
        throw new Error(`언어 감지 실패: ${response.status}`)
      }

      const result = await response.json()
      return result.data?.detections?.[0]?.[0]?.language || null
    } catch (error) {
      console.error('Language detection error:', error)
      return null
    }
  }
}

// 싱글톤 인스턴스
export const googleTranslateService = new GoogleTranslateService()

// 편의 함수 export
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  try {
    const result = await googleTranslateService.translateText(text, targetLanguage, sourceLanguage)
    return result?.text || text
  } catch (error) {
    console.error('Translation error:', error)
    // 번역 실패 시 원본 텍스트 반환
    return text
  }
}