import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/db/prisma'

// POST /api/admin/upload - 파일 업로드
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // logo, favicon, og-image, etc

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${type}_${timestamp}_${originalName}`

    // 업로드 디렉토리 경로
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'settings')
    
    // 디렉토리가 없으면 생성
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // 디렉토리가 이미 존재하는 경우 무시
    }

    // 파일 저장
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // 웹 접근 가능한 URL 생성
    const url = `/uploads/settings/${fileName}`

    // DB에 파일 정보 저장 (선택사항)
    if (type && authResult.user) {
      await prisma.file.create({
        data: {
          userId: authResult.user.id,
          filename: fileName,
          originalName: file.name,
          mimetype: file.type,
          size: file.size,
          path: filePath,
          url: url,
          type: type,
          metadata: JSON.stringify({
            uploadType: type,
            originalName: file.name,
            category: 'settings'
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      url: url,
      fileName: fileName,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/upload - 파일 삭제
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      )
    }

    // URL이 업로드 디렉토리 내의 파일인지 확인
    if (!url.startsWith('/uploads/settings/')) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      )
    }

    // 파일 삭제는 보안상 DB 레코드만 삭제하고 실제 파일은 유지
    // (정기적인 클린업 작업으로 처리)
    await prisma.file.deleteMany({
      where: { url }
    })

    return NextResponse.json({
      success: true,
      message: 'File record deleted'
    })

  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}