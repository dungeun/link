import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { googleTranslateService } from '@/lib/services/google-translate.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/admin/translations/auto - 자동 번역
export async function POST(request: NextRequest) {
  let testMode = false
  let testApiKey: string | undefined
  
  try {
    console.log('[API Auto] 요청 헤더:', {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie'),
      contentType: request.headers.get('content-type')
    })
    
    const body = await request.json()
    const { text, targetLanguages = ['en', 'ja'], sourceLanguage = 'ko' } = body
    testMode = body.testMode || false
    testApiKey = body.testApiKey
    
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      console.log('[API Auto] 인증 실패:', authResult.error)
      return authResult.error
    }
    
    console.log('[API Auto] 인증 성공:', authResult.user?.email)

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '번역할 텍스트를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      return NextResponse.json(
        { error: '대상 언어를 선택해주세요.' },
        { status: 400 }
      )
    }

    // 테스트 모드일 때 임시 API 키 설정
    let originalApiKey: string | undefined
    if (testMode && testApiKey) {
      originalApiKey = process.env.GOOGLE_TRANSLATE_API_KEY
      process.env.GOOGLE_TRANSLATE_API_KEY = testApiKey
      console.log('[API Test] 테스트 모드로 임시 API 키 설정')
      
      // 테스트 모드에서는 간단한 API 키 형식만 검증 (실제 Google API 호출 없음)
      if (!testApiKey.trim() || testApiKey.length < 10) {
        // 원래 키 복원
        if (originalApiKey !== undefined) {
          process.env.GOOGLE_TRANSLATE_API_KEY = originalApiKey
        }
        return NextResponse.json(
          { error: 'API 키 형식이 올바르지 않습니다.' },
          { status: 400 }
        )
      }
    }

    try {
      // API 키 검증 (테스트 모드에서는 testApiKey를 사용)
      const apiKeyToValidate = testMode ? testApiKey : undefined
      const isApiKeyValid = await googleTranslateService.validateApiKey(apiKeyToValidate)
      
      if (!isApiKeyValid) {
        // 테스트 모드에서 원래 키 복원
        if (testMode && originalApiKey !== undefined) {
          process.env.GOOGLE_TRANSLATE_API_KEY = originalApiKey
        }
        
        return NextResponse.json(
          { 
            error: testMode 
              ? 'API 키가 유효하지 않습니다. Google Cloud Console에서 API 키와 Translation API 활성화 상태를 확인해주세요.'
              : 'Google Translate API 키가 설정되지 않았거나 유효하지 않습니다.',
            success: false 
          },
          { status: testMode ? 400 : 500 }
        )
      }

      const translations: Record<string, unknown> = {}

    // 각 대상 언어별로 번역 수행 (테스트 모드에서는 모킹)
    for (const targetLang of targetLanguages) {
      try {
        let result
        
        // 실제 번역 수행 (테스트 모드든 일반 모드든 실제 API 호출)
        console.log(`[API ${testMode ? 'Test' : 'Normal'}] 번역 수행: ${text} -> ${targetLang}`)
        result = await googleTranslateService.translateText(
          text,
          targetLang,
          sourceLanguage
        )

        if (result) {
          translations[targetLang] = {
            text: result.text,
            confidence: result.confidence,
            source: result.source,
            target: result.target
          }
        }
      } catch (error) {
        console.error(`번역 실패 (${targetLang}):`, error)
        translations[targetLang] = {
          error: `${targetLang} 번역에 실패했습니다.`
        }
      }
    }

      // 테스트 모드에서는 원래 키 복원
      if (testMode && originalApiKey !== undefined) {
        process.env.GOOGLE_TRANSLATE_API_KEY = originalApiKey
        console.log('[API Test] 원래 API 키 복원')
      }

      // 테스트 모드일 때는 특별한 응답 형식
      if (testMode) {
        const englishTranslation = translations.en as any
        if (englishTranslation && !englishTranslation.error) {
          return NextResponse.json({
            success: true,
            message: 'API 키가 정상적으로 작동합니다.',
            testResult: {
              original: text,
              translated: englishTranslation.text,
              language: 'en'
            }
          })
        } else {
          return NextResponse.json(
            { error: 'API 키 테스트에 실패했습니다.' },
            { status: 400 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        original: {
          text,
          language: sourceLanguage
        },
        translations,
        timestamp: new Date().toISOString()
      })
    } catch (testError) {
      // 테스트 모드에서 오류 발생 시 원래 키 복원
      if (testMode && originalApiKey !== undefined) {
        process.env.GOOGLE_TRANSLATE_API_KEY = originalApiKey
        console.log('[API Test] 오류 발생으로 원래 API 키 복원')
      }
      throw testError
    }

  } catch (error) {
    console.error('자동 번역 처리 오류:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      testMode: testMode,
      testApiKey: testApiKey ? 'provided' : 'not provided'
    })
    
    let errorMessage = '자동 번역 처리 중 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      if (error.message.includes('API key not configured')) {
        errorMessage = 'Google Translate API 키가 설정되지 않았습니다.'
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Google Translate API에 연결할 수 없습니다. 네트워크를 확인해주세요.'
      } else {
        errorMessage = `오류: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        testMode: testMode || false,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// POST /api/admin/translations/auto/batch - 일괄 자동 번역
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()
    const { texts, targetLanguages = ['en', 'ja'], sourceLanguage = 'ko' } = body

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: '번역할 텍스트 배열을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      return NextResponse.json(
        { error: '대상 언어를 선택해주세요.' },
        { status: 400 }
      )
    }

    // API 키 유효성 검사
    const isApiKeyValid = await googleTranslateService.validateApiKey()
    if (!isApiKeyValid) {
      return NextResponse.json(
        { error: 'Google Translate API 키가 설정되지 않았거나 유효하지 않습니다.' },
        { status: 500 }
      )
    }

    const results: Array<{
      original: string
      translations: Record<string, unknown>
    }> = []

    // 각 텍스트에 대해 번역 수행
    for (const text of texts) {
      if (!text || typeof text !== 'string' || !text.trim()) {
        continue
      }

      const translations: Record<string, unknown> = {}

      for (const targetLang of targetLanguages) {
        try {
          const result = await googleTranslateService.translateText(
            text,
            targetLang,
            sourceLanguage
          )

          if (result) {
            translations[targetLang] = {
              text: result.text,
              confidence: result.confidence,
              source: result.source,
              target: result.target
            }
          }
        } catch (error) {
          console.error(`일괄 번역 실패 (${text} -> ${targetLang}):`, error)
          translations[targetLang] = {
            error: `${targetLang} 번역에 실패했습니다.`
          }
        }
      }

      results.push({
        original: text,
        translations
      })
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('일괄 자동 번역 처리 오류:', error)
    return NextResponse.json(
      { error: '일괄 자동 번역 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
