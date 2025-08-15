import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/influencer/applications - 내 지원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const user = await verifyJWT(token)
    
    if (user.type?.toUpperCase() !== 'INFLUENCER') {
      return NextResponse.json(
        { error: '인플루언서만 접근 가능합니다.' },
        { status: 403 }
      )
    }
    
    // 내 지원 목록 조회 - 최적화된 단일 쿼리
    const applications = await prisma.campaignApplication.findMany({
      where: {
        influencerId: user.id
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            budget: true,
            platform: true,
            business: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        contents: {
          select: {
            id: true,
            contentUrl: true,
            description: true,
            platform: true,
            status: true,
            createdAt: true,
            reviewedAt: true,
            feedback: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // 가장 최근 컨텐츠만 가져오기
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 데이터 형식 변환
    const formattedApplications = applications.map(app => ({
      id: app.id,
      campaignId: app.campaign.id,
      title: app.campaign.title,
      brand: app.campaign.business.name,
      status: app.status,
      appliedAt: app.createdAt,
      campaignStatus: app.campaign.status,
      startDate: app.campaign.startDate,
      endDate: app.campaign.endDate,
      budget: app.campaign.budget,
      platform: app.campaign.platform,
      message: app.message,
      submittedContent: app.contents && app.contents.length > 0 ? {
        url: app.contents[0].contentUrl,
        submittedDate: app.contents[0].createdAt,
        description: app.contents[0].description,
        platform: app.contents[0].platform,
        status: app.contents[0].status,
        feedback: app.contents[0].feedback
      } : null
    }))

    return NextResponse.json({ applications: formattedApplications })
  } catch (error) {
    console.error('지원 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '지원 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/influencer/applications - 캠페인 지원
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const user = await verifyJWT(token)
    
    if (user.type?.toUpperCase() !== 'INFLUENCER') {
      return NextResponse.json(
        { error: '인플루언서만 접근 가능합니다.' },
        { status: 403 }
      )
    }
    
    const { campaignId, message, portfolio } = await request.json()

    if (!campaignId || !message) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 캠페인 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 지원했는지 확인
    const existingApplication = await prisma.campaignApplication.findUnique({
      where: {
        campaignId_influencerId: {
          campaignId,
          influencerId: user.id
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: '이미 지원한 캠페인입니다.' },
        { status: 400 }
      )
    }

    // 지원 생성
    const application = await prisma.campaignApplication.create({
      data: {
        campaignId,
        influencerId: user.id,
        message,
        proposedPrice: null,
        status: 'PENDING'
      },
      include: {
        campaign: {
          include: {
            business: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      application: {
        id: application.id,
        campaignId: application.campaign.id,
        title: application.campaign.title,
        brand: application.campaign.business.name,
        status: application.status,
        appliedAt: application.createdAt
      }
    })
  } catch (error) {
    console.error('캠페인 지원 오류:', error)
    return NextResponse.json(
      { error: '캠페인 지원에 실패했습니다.' },
      { status: 500 }
    )
  }
}