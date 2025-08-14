import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/content/[id]/media - 콘텐츠에 미디어 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authorization 헤더 또는 쿠키에서 토큰 가져오기
    const authHeader = request.headers.get('authorization')
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get('auth-token')?.value || cookieStore.get('accessToken')?.value
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // JWT 토큰 검증
    const user = await verifyJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { url, type, order } = await request.json()

    if (!url || !type) {
      return NextResponse.json({ error: 'URL and type are required' }, { status: 400 })
    }

    // 콘텐츠 존재 확인 및 권한 체크
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      include: {
        application: {
          select: {
            influencerId: true
          }
        }
      }
    })

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // 인플루언서만 자신의 콘텐츠에 미디어를 추가할 수 있음
    if (user.type === 'INFLUENCER' && content.application.influencerId !== user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // 업로드된 파일을 URL로 찾기
    const file = await prisma.file.findFirst({
      where: {
        url: url,
        userId: user.id
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // 미디어 생성
    const media = await prisma.contentMedia.create({
      data: {
        contentId: params.id,
        fileId: file.id,
        type,
        order: order || 0
      }
    })

    return NextResponse.json({ 
      success: true,
      media 
    })

  } catch (error) {
    console.error('Content media API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}