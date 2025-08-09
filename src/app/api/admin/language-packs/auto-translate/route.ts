import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'
import { translateText } from '@/lib/services/google-translate.service'

// POST /api/admin/language-packs/auto-translate - 언어팩 자동 번역 및 추가
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()
    const { key, ko, category, autoTranslate } = body

    // 필수 파라미터 확인
    if (!key || !ko || !category) {
      return NextResponse.json(
        { error: 'Key, Korean text, and category are required' },
        { status: 400 }
      )
    }

    // 기존 키 중복 확인
    const existingKey = await prisma.languagePack.findUnique({
      where: { key }
    })

    if (existingKey) {
      return NextResponse.json(
        { error: 'Language pack key already exists' },
        { status: 409 }
      )
    }

    let en = ko
    let ja = ko

    // 자동 번역 수행
    if (autoTranslate) {
      try {
        // 한국어 → 영어 번역
        en = await translateText(ko, 'ko', 'en')
        
        // 한국어 → 일본어 번역
        ja = await translateText(ko, 'ko', 'ja')
      } catch (translationError) {
        console.error('Translation error:', translationError)
        // 번역 실패 시 원본 텍스트 사용
        en = ko
        ja = ko
      }
    }

    // 언어팩 생성
    const languagePack = await prisma.languagePack.create({
      data: {
        key,
        ko,
        en,
        ja,
        category,
        description: `Auto-generated menu item for: ${ko}`,
        isEditable: true
      }
    })

    console.log('Language pack created:', languagePack)

    return NextResponse.json({
      success: true,
      key: languagePack.key,
      ko: languagePack.ko,
      en: languagePack.en,
      ja: languagePack.ja
    })

  } catch (error) {
    console.error('Language pack auto-translate error:', error)
    return NextResponse.json(
      { error: 'Failed to create language pack with translation' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/language-packs/auto-translate - 기존 언어팩 업데이트 및 자동 번역
export async function PUT(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()
    const { key, ko, autoTranslate } = body

    // 필수 파라미터 확인
    if (!key || !ko) {
      return NextResponse.json(
        { error: 'Key and Korean text are required' },
        { status: 400 }
      )
    }

    // 기존 언어팩 확인
    const existingPack = await prisma.languagePack.findUnique({
      where: { key }
    })

    if (!existingPack) {
      return NextResponse.json(
        { error: 'Language pack not found' },
        { status: 404 }
      )
    }

    let en = existingPack.en
    let ja = existingPack.ja

    // 자동 번역 수행
    if (autoTranslate) {
      try {
        // 한국어 → 영어 번역
        en = await translateText(ko, 'ko', 'en')
        
        // 한국어 → 일본어 번역
        ja = await translateText(ko, 'ko', 'ja')
      } catch (translationError) {
        console.error('Translation error:', translationError)
        // 번역 실패 시 기존 값 유지
      }
    }

    // 언어팩 업데이트
    const updatedPack = await prisma.languagePack.update({
      where: { key },
      data: {
        ko,
        en,
        ja,
        updatedAt: new Date()
      }
    })

    console.log('Language pack updated:', updatedPack)

    return NextResponse.json({
      success: true,
      key: updatedPack.key,
      ko: updatedPack.ko,
      en: updatedPack.en,
      ja: updatedPack.ja
    })

  } catch (error) {
    console.error('Language pack update error:', error)
    return NextResponse.json(
      { error: 'Failed to update language pack' },
      { status: 500 }
    )
  }
}