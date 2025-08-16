import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    const userId = (authResult as any).userId
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    // 인플루언서 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        type: 'INFLUENCER'
      },
      include: {
        profile: true,
        applications: {
          where: {
            status: 'APPROVED'
          },
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            campaign: {
              include: {
                business: true
              }
            },
            contents: {
              where: {
                status: 'APPROVED'
              }
            }
          }
        }
      }
    })

    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json({ error: '인플루언서 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 포트폴리오 데이터 형식화
    const portfolios = user.applications
      .filter((app: any) => app.contents && app.contents.length > 0)
      .map((app: any) => ({
        id: app.id,
        campaignTitle: app.campaign?.title || 'Unknown Campaign',
        brand: app.campaign?.business?.name || 'Unknown Brand',
        platform: app.campaign?.platform || 'instagram',
        contentUrl: app.contents[0]?.contentUrl || '#',
        description: app.contents[0]?.description || '',
        createdAt: app.contents[0]?.createdAt || app.createdAt,
        status: 'COMPLETED'
      }))

    // 통계 계산
    const statistics = {
      totalCampaigns: user.applications.filter((app: any) => app.status === 'APPROVED').length,
      completedCampaigns: portfolios.length,
      totalEarnings: 0, // 실제 수익 계산 로직 필요
      averageRating: 0 // 평점 시스템 구현 필요
    }

    return NextResponse.json({
      portfolios,
      statistics
    })
  } catch (error) {
    console.error('Failed to fetch portfolio:', error)
    return NextResponse.json(
      { error: '포트폴리오 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    const userId = (authResult as any).userId
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { applicationId, contentUrl, description, platform } = body

    // 컨텐츠 생성
    const content = await prisma.content.create({
      data: {
        applicationId,
        contentUrl,
        description,
        platform,
        status: 'PENDING_REVIEW'
      }
    })

    return NextResponse.json({
      message: '포트폴리오가 추가되었습니다.',
      content
    })
  } catch (error) {
    console.error('Failed to add portfolio:', error)
    return NextResponse.json(
      { error: '포트폴리오 추가에 실패했습니다.' },
      { status: 500 }
    )
  }
}