import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'
import { googleTranslateService } from '@/lib/services/google-translate.service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/admin/translations/batch - 타입별 일괄 자동 번역
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()
    const { type, targetLanguages = ['en', 'ja'], sourceLanguage = 'ko' } = body

    if (!type || !['campaign', 'post', 'menu', 'main-sections'].includes(type)) {
      return NextResponse.json(
        { error: '유효한 타입을 선택해주세요. (campaign, post, menu, main-sections)' },
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

    let translatedCount = 0
    let errorCount = 0
    const errors: string[] = []

    if (type === 'campaign') {
      // 캠페인 번역되지 않은 항목들 조회
      const campaigns = await prisma.campaign.findMany({
        include: {
          campaignTranslations: true
        },
        take: 100 // 한 번에 최대 100개
      })

      for (const campaign of campaigns) {
        if (!campaign.title?.trim()) continue

        for (const targetLang of targetLanguages) {
          const existingTranslation = campaign.campaignTranslations.find(
            t => t.language === targetLang
          )

          // 이미 번역이 있으면 스킵
          if (existingTranslation && existingTranslation.title) {
            continue
          }

          try {
            const result = await googleTranslateService.translateText(
              campaign.title,
              targetLang,
              sourceLanguage
            )

            if (result) {
              await prisma.campaignTranslation.upsert({
                where: {
                  campaignId_language: {
                    campaignId: campaign.id,
                    language: targetLang
                  }
                },
                update: {
                  title: result.text,
                  isAutoTranslated: true,
                  lastEditedBy: authResult.user.id,
                  editedAt: new Date()
                },
                create: {
                  campaignId: campaign.id,
                  language: targetLang,
                  title: result.text,
                  description: '',
                  hashtags: [],
                  isAutoTranslated: true,
                  lastEditedBy: authResult.user.id,
                  editedAt: new Date()
                }
              })
              translatedCount++
            }
          } catch (error) {
            console.error(`캠페인 번역 실패 (${campaign.id} -> ${targetLang}):`, error)
            errorCount++
            errors.push(`캠페인 "${campaign.title}" ${targetLang} 번역 실패`)
          }
        }
      }
    } else if (type === 'post') {
      // 게시물 번역되지 않은 항목들 조회
      const posts = await prisma.post.findMany({
        include: {
          postTranslations: true
        },
        take: 100 // 한 번에 최대 100개
      })

      for (const post of posts) {
        if (!post.title?.trim()) continue

        for (const targetLang of targetLanguages) {
          const existingTranslation = post.postTranslations.find(
            t => t.language === targetLang
          )

          // 이미 번역이 있으면 스킵
          if (existingTranslation && existingTranslation.title) {
            continue
          }

          try {
            const result = await googleTranslateService.translateText(
              post.title,
              targetLang,
              sourceLanguage
            )

            if (result) {
              await prisma.postTranslation.upsert({
                where: {
                  postId_language: {
                    postId: post.id,
                    language: targetLang
                  }
                },
                update: {
                  title: result.text,
                  isAutoTranslated: true,
                  lastEditedBy: authResult.user.id,
                  editedAt: new Date()
                },
                create: {
                  postId: post.id,
                  language: targetLang,
                  title: result.text,
                  content: '',
                  isAutoTranslated: true,
                  lastEditedBy: authResult.user.id,
                  editedAt: new Date()
                }
              })
              translatedCount++
            }
          } catch (error) {
            console.error(`게시물 번역 실패 (${post.id} -> ${targetLang}):`, error)
            errorCount++
            errors.push(`게시물 "${post.title}" ${targetLang} 번역 실패`)
          }
        }
      }
    } else if (type === 'menu' || type === 'main-sections') {
      // LanguagePack 번역되지 않은 항목들 조회
      let whereClause = {}
      
      if (type === 'menu') {
        // 메뉴 관련 카테고리
        whereClause = {
          OR: [
            { category: 'ui_menu' },
            { category: 'ui_action' },
            { category: 'ui_notification' }
          ]
        }
      } else {
        // 메인 섹션 관련 카테고리
        whereClause = {
          OR: [
            { category: 'ui_hero' },
            { category: 'ui_category' },
            { category: 'ui_quicklink' },
            { category: 'ui_promo' },
            { category: 'ui_ranking' },
            { category: 'ui_footer' }
          ]
        }
      }
      
      const languagePacks = await prisma.languagePack.findMany({
        where: whereClause
      })

      for (const pack of languagePacks) {
        if (!pack.ko?.trim()) continue

        for (const targetLang of targetLanguages) {
          const currentValue = targetLang === 'en' ? pack.en : pack.ja

          // 이미 번역이 있으면 스킵
          if (currentValue) {
            continue
          }

          try {
            const result = await googleTranslateService.translateText(
              pack.ko,
              targetLang,
              sourceLanguage
            )

            if (result) {
              const updateData = targetLang === 'en' 
                ? { en: result.text }
                : { ja: result.text }

              await prisma.languagePack.update({
                where: { id: pack.id },
                data: updateData
              })
              translatedCount++
            }
          } catch (error) {
            console.error(`${type === 'menu' ? '메뉴' : '메인 섹션'} 번역 실패 (${pack.id} -> ${targetLang}):`, error)
            errorCount++
            errors.push(`${type === 'menu' ? '메뉴' : '메인 섹션'} "${pack.ko}" ${targetLang} 번역 실패`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      translated: translatedCount,
      errors: errorCount,
      errorMessages: errors.slice(0, 10), // 최대 10개의 에러 메시지만 반환
      type,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('일괄 번역 처리 오류:', error)
    return NextResponse.json(
      { error: '일괄 번역 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}