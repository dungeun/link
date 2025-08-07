import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await authenticateRequest(request)
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    // 비즈니스 프로필 확인
    const business = await prisma.business.findUnique({
      where: { user_id: userId }
    })

    if (!business) {
      return NextResponse.json({ error: '비즈니스 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 현재 날짜 기준
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 지난달 캠페인 수
    const lastMonthCampaigns = await prisma.campaign.count({
      where: {
        business_id: business.id,
        created_at: {
          gte: lastMonth,
          lt: thisMonth
        }
      }
    })

    // 이번달 캠페인 수
    const thisMonthCampaigns = await prisma.campaign.count({
      where: {
        business_id: business.id,
        created_at: {
          gte: thisMonth
        }
      }
    })

    // 지난주 활성 캠페인 수
    const lastWeekActiveCampaigns = await prisma.campaign.count({
      where: {
        business_id: business.id,
        status: 'ACTIVE',
        created_at: {
          lt: lastWeek
        }
      }
    })

    // 이번주 활성 캠페인 수
    const thisWeekActiveCampaigns = await prisma.campaign.count({
      where: {
        business_id: business.id,
        status: 'ACTIVE'
      }
    })

    // 이번달 지원자 수
    const thisMonthApplications = await prisma.application.count({
      where: {
        campaign: {
          business_id: business.id
        },
        created_at: {
          gte: thisMonth
        }
      }
    })

    // 지난달 지원자 수
    const lastMonthApplications = await prisma.application.count({
      where: {
        campaign: {
          business_id: business.id
        },
        created_at: {
          gte: lastMonth,
          lt: thisMonth
        }
      }
    })

    // ROI 계산 (간단한 예시 - 실제로는 더 복잡한 계산 필요)
    const totalSpent = await prisma.payment.aggregate({
      where: {
        business_id: business.id,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    })

    const totalRevenue = await prisma.campaign.aggregate({
      where: {
        business_id: business.id,
        status: 'COMPLETED'
      },
      _sum: {
        budget: true
      }
    })

    const roi = totalSpent._sum.amount && totalRevenue._sum.budget 
      ? Math.round((totalRevenue._sum.budget / totalSpent._sum.amount) * 100)
      : 0

    // 성장률 계산
    const campaignGrowth = lastMonthCampaigns > 0 
      ? Math.round(((thisMonthCampaigns - lastMonthCampaigns) / lastMonthCampaigns) * 100)
      : thisMonthCampaigns > 0 ? 100 : 0

    const activeCampaignGrowth = lastWeekActiveCampaigns > 0
      ? Math.round(((thisWeekActiveCampaigns - lastWeekActiveCampaigns) / lastWeekActiveCampaigns) * 100)
      : thisWeekActiveCampaigns > 0 ? 100 : 0

    const applicationGrowth = lastMonthApplications > 0
      ? Math.round(((thisMonthApplications - lastMonthApplications) / lastMonthApplications) * 100)
      : thisMonthApplications > 0 ? 100 : 0

    return NextResponse.json({
      growth: {
        campaigns: {
          value: campaignGrowth,
          period: 'month',
          current: thisMonthCampaigns,
          previous: lastMonthCampaigns
        },
        activeCampaigns: {
          value: activeCampaignGrowth,
          period: 'week',
          current: thisWeekActiveCampaigns,
          previous: lastWeekActiveCampaigns
        },
        applications: {
          value: applicationGrowth,
          period: 'month',
          current: thisMonthApplications,
          previous: lastMonthApplications
        }
      },
      roi: roi,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Business growth stats error:', error)
    return NextResponse.json(
      { error: '성장 통계를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}