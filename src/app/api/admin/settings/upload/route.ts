import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'
import { writeFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'favicon', 'ogImage', 'appleTouchIcon'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon', 'image/ico']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPEG, SVG, and ICO files are allowed.' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // 파일 이름 생성
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    let fileName: string
    let settingKey: string

    switch (type) {
      case 'favicon':
        fileName = `favicon-${timestamp}.${fileExtension}`
        settingKey = 'metadata.favicon'
        break
      case 'ogImage':
        fileName = `og-image-${timestamp}.${fileExtension}`
        settingKey = 'metadata.ogImage'
        break
      case 'appleTouchIcon':
        fileName = `apple-touch-icon-${timestamp}.${fileExtension}`
        settingKey = 'metadata.appleTouchIcon'
        break
      case 'twitterImage':
        fileName = `twitter-image-${timestamp}.${fileExtension}`
        settingKey = 'metadata.twitterImage'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid upload type' },
          { status: 400 }
        )
    }

    // 파일 저장 경로
    const publicDir = path.join(process.cwd(), 'public', 'seo')
    const filePath = path.join(publicDir, fileName)
    const publicUrl = `/seo/${fileName}`

    // public/seo 디렉토리 생성 (없는 경우)
    const { mkdir } = await import('fs/promises')
    await mkdir(publicDir, { recursive: true })

    // 파일 저장
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // DB에서 현재 metadata 설정 가져오기
    const metadataConfig = await prisma.siteConfig.findUnique({
      where: { key: 'metadata' }
    })

    let metadata: Record<string, any> = {}
    if (metadataConfig) {
      try {
        metadata = JSON.parse(metadataConfig.value)
      } catch (e) {
        metadata = {}
      }
    }

    // metadata 업데이트
    const keys = settingKey.split('.')
    if (keys[0] === 'metadata' && keys[1]) {
      metadata[keys[1]] = publicUrl
    }

    // DB에 저장
    await prisma.siteConfig.upsert({
      where: { key: 'metadata' },
      update: { value: JSON.stringify(metadata) },
      create: { 
        key: 'metadata', 
        value: JSON.stringify(metadata),
        category: 'seo'
      }
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      message: `${type} uploaded successfully`
    })

  } catch (error) {
    console.error('Upload file error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
