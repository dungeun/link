import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'
import { googleTranslateService } from '@/lib/services/google-translate.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/admin/translations/settings - API 설정 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    // 데이터베이스에서 설정 조회
    const settings = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            'google_translate_api_key',
            'google_translate_default_source_lang',
            'google_translate_default_target_langs',
            'google_translate_auto_translate_on_create'
          ]
        }
      }
    })

    // 설정값들을 객체로 변환
    const config = settings.reduce((acc, setting) => {
      switch (setting.key) {
        case 'google_translate_api_key':
          // API 키는 보안을 위해 마스킹
          acc.apiKey = setting.value ? '****' + setting.value.slice(-4) : ''
          break
        case 'google_translate_default_source_lang':
          acc.defaultSourceLang = setting.value || 'ko'
          break
        case 'google_translate_default_target_langs':
          acc.defaultTargetLangs = setting.value ? JSON.parse(setting.value) : ['en', 'jp']
          break
        case 'google_translate_auto_translate_on_create':
          acc.autoTranslateOnCreate = setting.value === 'true'
          break
      }
      return acc
    }, {} as { apiKey?: string; defaultSourceLang?: string; defaultTargetLangs?: string[]; autoTranslateOnCreate?: boolean })

    // 기본값 설정
    const result = {
      apiKey: config.apiKey || '',
      defaultSourceLang: config.defaultSourceLang || 'ko',
      defaultTargetLangs: config.defaultTargetLangs || ['en', 'jp'],
      autoTranslateOnCreate: config.autoTranslateOnCreate || false
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('API 설정 조회 오류:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'API 설정 조회에 실패했습니다.' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// POST /api/admin/translations/settings - API 설정 저장
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()
    const { 
      apiKey, 
      defaultSourceLang = 'ko', 
      defaultTargetLangs = ['en', 'jp'], 
      autoTranslateOnCreate = false 
    } = body

    // API 키 유효성 검사 (새 키가 제공된 경우)
    if (apiKey && !apiKey.startsWith('****')) {
      // API 키 형식 사전 검사
      if (apiKey.includes('-') && apiKey.includes('.apps.googleusercontent.com')) {
        return NextResponse.json(
          { 
            error: '❌ OAuth 클라이언트 ID가 아닌 Google Translate API 키가 필요합니다.\n\n올바른 API 키 생성 방법:\n1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보\n2. "사용자 인증 정보 만들기" → "API 키" 선택\n3. 생성된 키는 "AIza..."로 시작합니다\n\n현재 입력된 값은 OAuth 클라이언트 ID입니다.',
            success: false 
          },
          { status: 400 }
        )
      }
      
      if (!apiKey.startsWith('AIza') || apiKey.length !== 39) {
        return NextResponse.json(
          { 
            error: '❌ Google Translate API 키 형식이 올바르지 않습니다.\n\n올바른 형식:\n- "AIza"로 시작\n- 총 39자 길이\n- 예: AIzaSyD...\n\nGoogle Cloud Console에서 올바른 API 키를 생성하세요.',
            success: false 
          },
          { status: 400 }
        )
      }

      try {
        console.log('[API Settings] API 키 검증 시작...')
        const isValid = await googleTranslateService.validateApiKey(apiKey)
        
        if (!isValid) {
          console.log('[API Settings] API 키 검증 실패')
          return NextResponse.json(
            { 
              error: '❌ API 키가 유효하지 않거나 Translation API가 비활성화되어 있습니다.\n\n확인사항:\n1. Google Cloud Console에서 Translation API가 활성화되어 있는지 확인\n2. API 키에 Translation API 권한이 있는지 확인\n3. 결제 계정이 연결되어 있는지 확인\n4. API 키 제한 설정 확인',
              success: false 
            },
            { status: 400 }
          )
        }
        
        console.log('[API Settings] API 키 검증 성공')
      } catch (error) {
        console.error('[API Settings] API 키 검증 오류:', error)
        return NextResponse.json(
          { 
            error: `API 키 검증 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            success: false 
          },
          { status: 400 }
        )
      }
    }

    // 설정값들을 데이터베이스에 저장
    const updates = []

    // API 키 저장 (마스킹되지 않은 실제 키인 경우에만)
    if (apiKey && !apiKey.startsWith('****')) {
      updates.push(
        prisma.siteConfig.upsert({
          where: { key: 'google_translate_api_key' },
          update: { value: apiKey },
          create: { key: 'google_translate_api_key', value: apiKey }
        })
      )
    }

    updates.push(
      prisma.siteConfig.upsert({
        where: { key: 'google_translate_default_source_lang' },
        update: { value: defaultSourceLang },
        create: { key: 'google_translate_default_source_lang', value: defaultSourceLang }
      }),
      prisma.siteConfig.upsert({
        where: { key: 'google_translate_default_target_langs' },
        update: { value: JSON.stringify(defaultTargetLangs) },
        create: { key: 'google_translate_default_target_langs', value: JSON.stringify(defaultTargetLangs) }
      }),
      prisma.siteConfig.upsert({
        where: { key: 'google_translate_auto_translate_on_create' },
        update: { value: autoTranslateOnCreate.toString() },
        create: { key: 'google_translate_auto_translate_on_create', value: autoTranslateOnCreate.toString() }
      })
    )

    await Promise.all(updates)

    return NextResponse.json({ 
      success: true, 
      message: 'API 설정이 성공적으로 저장되었습니다.' 
    })
  } catch (error) {
    console.error('API 설정 저장 오류:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'API 설정 저장에 실패했습니다.' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// PUT /api/admin/translations/settings/test - API 키 테스트
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 임시로 환경변수 설정해서 API 키 테스트
    const originalKey = process.env.GOOGLE_TRANSLATE_API_KEY
    process.env.GOOGLE_TRANSLATE_API_KEY = apiKey
    
    try {
      console.log('[API Test] API 키 테스트 시작...')
      
      // 간단한 번역 테스트
      const testResult = await googleTranslateService.translateText('안녕하세요', 'en', 'ko')
      
      console.log('[API Test] 번역 결과:', testResult)
      
      // 원래 키 복원
      process.env.GOOGLE_TRANSLATE_API_KEY = originalKey
      
      if (testResult && testResult.text) {
        console.log('[API Test] 테스트 성공')
        return NextResponse.json({
          success: true,
          message: 'API 키가 정상적으로 작동합니다.',
          testResult: {
            original: '안녕하세요',
            translated: testResult.text,
            language: 'en'
          }
        })
      } else {
        console.log('[API Test] 번역 결과가 없음')
        return NextResponse.json(
          { error: 'API 키 테스트에 실패했습니다. 번역 결과를 받을 수 없습니다.' },
          { status: 400 }
        )
      }
    } catch (error) {
      // 원래 키 복원
      process.env.GOOGLE_TRANSLATE_API_KEY = originalKey
      
      console.error('[API Test] 상세 오류 정보:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })

      let errorMessage = 'API 키 테스트 중 오류가 발생했습니다.'
      
      if (error instanceof Error) {
        if (error.message.includes('API key not configured')) {
          errorMessage = 'API 키가 설정되지 않았습니다.'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Google Translate API에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
        } else if (error.message.includes('400')) {
          errorMessage = 'API 키가 유효하지 않습니다.'
        } else if (error.message.includes('403')) {
          errorMessage = 'API 키에 Translation API 권한이 없습니다.'
        } else if (error.message.includes('429')) {
          errorMessage = 'API 사용량 한도를 초과했습니다.'
        } else {
          errorMessage = `API 오류: ${error.message}`
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('API 키 테스트 처리 오류:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'API 키 테스트 처리 중 오류가 발생했습니다.' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
