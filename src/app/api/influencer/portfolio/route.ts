import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await authenticateRequest(request)
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    // 인플루언서 프로필 조회
    const influencer = await prisma.influencer.findUnique({
      where: { user_id: userId },
      include: {
        portfolios: {
          orderBy: {
            created_at: 'desc'
          },
          include: {
            campaign: {
              include: {
                business: true
              }
            }
          }
        },
        applications: {
          where: {
            status: 'COMPLETED'
          },
          include: {
            campaign: true
          }
        }
      }
    })

    if (!influencer) {
      return NextResponse.json({ error: '인플루언서 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 포트폴리오 아이템 형식화
    const portfolioItems = influencer.portfolios.map(portfolio => ({
      id: portfolio.id,
      title: portfolio.title,
      description: portfolio.description,
      imageUrl: portfolio.image_url,
      platform: portfolio.platform,
      link: portfolio.link,
      metrics: {
        views: portfolio.view_count || 0,
        likes: portfolio.like_count || 0,
        comments: portfolio.comment_count || 0,
        shares: portfolio.share_count || 0
      },
      campaign: portfolio.campaign ? {
        id: portfolio.campaign.id,
        title: portfolio.campaign.title,
        brand: portfolio.campaign.business?.name || 'Unknown Brand'
      } : null,
      createdAt: portfolio.created_at
    }))

    // 통계 계산
    const totalViews = portfolioItems.reduce((sum, item) => sum + item.metrics.views, 0)
    const totalLikes = portfolioItems.reduce((sum, item) => sum + item.metrics.likes, 0)
    const avgEngagement = portfolioItems.length > 0 
      ? Math.round((totalLikes / totalViews) * 100 * 10) / 10 
      : 0

    const stats = {
      totalProjects: portfolioItems.length,
      completedCampaigns: influencer.applications.length,
      totalViews,
      avgEngagement
    }

    return NextResponse.json({
      portfolioItems,
      stats
    })
  } catch (error) {
    console.error('Portfolio API error:', error)
    return NextResponse.json(
      { error: '포트폴리오를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 포트폴리오 아이템 추가
export async function POST(request: NextRequest) {
  try {
    const { userId } = await authenticateRequest(request)
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, imageUrl, platform, link, campaignId, metrics } = body

    if (!title || !platform) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 인플루언서 확인
    const influencer = await prisma.influencer.findUnique({
      where: { user_id: userId }
    })

    if (!influencer) {
      return NextResponse.json({ error: '인플루언서 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 포트폴리오 생성
    const portfolio = await prisma.portfolio.create({
      data: {
        influencer_id: influencer.id,
        title,
        description,
        image_url: imageUrl,
        platform,
        link,
        campaign_id: campaignId,
        view_count: metrics?.views || 0,
        like_count: metrics?.likes || 0,
        comment_count: metrics?.comments || 0,
        share_count: metrics?.shares || 0
      }
    })

    return NextResponse.json({
      success: true,
      portfolio
    })
  } catch (error) {
    console.error('Create portfolio error:', error)
    return NextResponse.json(
      { error: '포트폴리오 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}