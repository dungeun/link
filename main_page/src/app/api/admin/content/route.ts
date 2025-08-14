import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const platform = searchParams.get('platform')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 필터 조건 구성
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (type && type !== 'all') {
      where.type = type
    }
    
    if (platform && platform !== 'all') {
      where.campaign = {
        platform: platform
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { campaign: { title: { contains: search, mode: 'insensitive' } } },
        { influencer: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // 콘텐츠 목록 조회
    const contents = await prisma.content.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
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
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // 총 개수 조회
    const totalCount = await prisma.content.count({ where })

    // 응답 데이터 포맷팅
    const formattedContents = contents.map(content => ({
      id: content.id,
      title: content.application?.campaign?.title || '제목 없음',
      type: 'post', // 기본값으로 post 타입 설정
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
      campaignPlatform: content.platform,
      views: 0, // 기본값
      likes: 0, // 기본값
      comments: 0 // 기본값
    }))

    return NextResponse.json({
      contents: formattedContents,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Admin content API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}