import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'
import { translateText } from '@/lib/services/google-translate.service'

// GET /api/admin/language-packs/[key] - 특정 언어팩 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const languagePack = await prisma.languagePack.findUnique({
      where: { key: params.key }
    })

    if (!languagePack) {
      return NextResponse.json(
        { error: 'Language pack not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      key: languagePack.key,
      ko: languagePack.ko,
      en: languagePack.en,
      jp: languagePack.jp,
      category: languagePack.category,
      description: languagePack.description,
      isEditable: languagePack.isEditable
    })

  } catch (error) {
    console.error('Language pack get error:', error)
    return NextResponse.json(
      { error: 'Failed to get language pack' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/language-packs/[key] - 언어팩 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const body = await request.json()
    const { ko, en, jp, autoTranslate } = body

    // 기존 언어팩 확인
    const existingPack = await prisma.languagePack.findUnique({
      where: { key: params.key }
    })

    if (!existingPack) {
      return NextResponse.json(
        { error: 'Language pack not found' },
        { status: 404 }
      )
    }

    // 수정 가능 여부 확인
    if (!existingPack.isEditable) {
      return NextResponse.json(
        { error: 'This language pack is not editable' },
        { status: 403 }
      )
    }

    let updateData: Record<string, unknown> = {}

    // 한국어가 변경되고 자동 번역이 요청된 경우
    if (ko && autoTranslate) {
      updateData.ko = ko
      try {
        // 한국어 → 영어 번역
        updateData.en = await translateText(ko, 'ko', 'en')
        
        // 한국어 → 일본어 번역
        updateData.jp = await translateText(ko, 'ko', 'ja')
      } catch (translationError) {
        console.error('Translation error:', translationError)
        // 번역 실패 시 제공된 값 사용
        if (en) updateData.en = en
        if (jp) updateData.jp = jp
      }
    } else {
      // 자동 번역 없이 제공된 값만 업데이트
      if (ko) updateData.ko = ko
      if (en) updateData.en = en
      if (jp) updateData.jp = jp
    }

    // 언어팩 업데이트
    const updatedPack = await prisma.languagePack.update({
      where: { key: params.key },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    console.log('Language pack updated:', updatedPack)

    return NextResponse.json({
      success: true,
      key: updatedPack.key,
      ko: updatedPack.ko,
      en: updatedPack.en,
      jp: updatedPack.jp
    })

  } catch (error) {
    console.error('Language pack update error:', error)
    return NextResponse.json(
      { error: 'Failed to update language pack' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/language-packs/[key] - 언어팩 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    // 기존 언어팩 확인
    const existingPack = await prisma.languagePack.findUnique({
      where: { key: params.key }
    })

    if (!existingPack) {
      return NextResponse.json(
        { error: 'Language pack not found' },
        { status: 404 }
      )
    }

    // 수정 가능 여부 확인 (커스텀 메뉴만 삭제 가능)
    if (!existingPack.isEditable || !params.key.includes('custom_')) {
      return NextResponse.json(
        { error: 'This language pack cannot be deleted' },
        { status: 403 }
      )
    }

    // 언어팩 삭제
    await prisma.languagePack.delete({
      where: { key: params.key }
    })

    console.log('Language pack deleted:', params.key)

    return NextResponse.json({
      success: true,
      message: 'Language pack deleted successfully'
    })

  } catch (error) {
    console.error('Language pack delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete language pack' },
      { status: 500 }
    )
  }
}