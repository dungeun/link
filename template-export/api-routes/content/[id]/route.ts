import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/admin/content/[id] - 콘텐츠 상세 조회
export async function GET(
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

    if (user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 콘텐츠 상세 조회
    const content = await prisma.content.findUnique({
      where: { id: params.id },
      include: {
        application: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true
              }
            },
            influencer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        media: {
          select: {
            id: true,
            type: true,
            order: true,
            file: {
              select: {
                id: true,
                url: true,
                filename: true,
                originalName: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // 응답 데이터 포맷팅
    const formattedContent = {
      id: content.id,
      title: content.application?.campaign?.title || '제목 없음',
      type: 'post',
      status: content.status,
      createdAt: content.createdAt.toISOString().split('T')[0],
      reviewedAt: content.reviewedAt?.toISOString().split('T')[0],
      url: content.contentUrl,
      description: content.description,
      platform: content.platform,
      feedback: content.feedback,
      applicationId: content.applicationId,
      campaignId: content.application?.campaign?.id,
      campaignTitle: content.application?.campaign?.title,
      influencerName: content.application?.influencer?.name,
      views: 0,
      likes: 0,
      comments: 0,
      media: content.media?.map(m => ({
        id: m.id,
        url: m.file.url,
        type: m.type,
        order: m.order,
        filename: m.file.originalName || m.file.filename
      })) || []
    }

    return NextResponse.json({ content: formattedContent })

  } catch (error) {
    console.error('Admin content detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    if (user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { status, feedback } = await request.json()

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // 콘텐츠 상태 업데이트
    const updatedContent = await prisma.content.update({
      where: { id: params.id },
      data: {
        status,
        feedback,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      content: updatedContent
    })

  } catch (error) {
    console.error('Content status update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}