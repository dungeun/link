import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/analytics - 통계 데이터 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('authorization')
    let token = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get('auth-token')?.value
    }

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const payload = await verifyJWT(token)
    if (payload.type !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    // 날짜 범위 파라미터
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30days'
    
    let startDate = new Date()
    switch (range) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // 개요 통계
    const totalUsers = await prisma.user.count()
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    })
    const userGrowth = totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0

    const totalCampaigns = await prisma.campaign.count({
      where: {
        status: 'ACTIVE'
      }
    })

    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        amount: true
      }
    })

    const previousRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          lt: startDate,
          gte: new Date(startDate.getTime() - (new Date().getTime() - startDate.getTime()))
        }
      },
      _sum: {
        amount: true
      }
    })

    const revenueGrowth = (previousRevenue._sum.amount || 0) > 0 
      ? Math.round(((totalRevenue._sum.amount || 0) - (previousRevenue._sum.amount || 0)) / (previousRevenue._sum.amount || 1) * 100)
      : 0

    const totalSettlements = await prisma.settlement.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        totalAmount: true
      }
    }).catch(() => ({ _sum: { totalAmount: 0 } }))

    // 사용자 통계
    const usersByType = await prisma.user.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    })

    // 월별 사용자 증가 (최근 6개월)
    const usersByMonth: any[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)

      const influencers = await prisma.user.count({
        where: {
          type: 'INFLUENCER',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      })

      const businesses = await prisma.user.count({
        where: {
          type: 'BUSINESS',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      })

      usersByMonth.push({
        month: monthStart.toLocaleDateString('ko-KR', { month: 'short' }),
        influencers,
        businesses
      })
    }

    // 캠페인 통계
    const campaignsByStatus = await prisma.campaign.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const campaignsByCategory = await prisma.campaign.findMany({
      select: {
        business: {
          select: {
            businessProfile: {
              select: {
                businessCategory: true
              }
            }
          }
        }
      }
    })

    const categoryCount: Record<string, number> = {}
    campaignsByCategory.forEach(campaign => {
      const category = campaign.business.businessProfile?.businessCategory || '기타'
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })

    // 월별 캠페인 및 매출 (최근 6개월)
    const campaignsByMonth: any[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)

      const count = await prisma.campaign.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      })

      const revenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: {
          amount: true
        }
      })

      campaignsByMonth.push({
        month: monthStart.toLocaleDateString('ko-KR', { month: 'short' }),
        count,
        revenue: revenue._sum.amount || 0
      })
    }

    // 매출 통계
    const revenueByMonth: any[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)

      const revenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: {
          amount: true
        }
      })

      const settlements = await prisma.settlement.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _sum: {
          totalAmount: true
        }
      }).catch(() => ({ _sum: { totalAmount: 0 } }))

      revenueByMonth.push({
        month: monthStart.toLocaleDateString('ko-KR', { month: 'short' }),
        revenue: revenue._sum.amount || 0,
        settlements: settlements._sum.totalAmount || 0,
        profit: (revenue._sum.amount || 0) - (settlements._sum.totalAmount || 0)
      })
    }

    // 결제 방법별 매출
    const paymentMethods = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        amount: true
      }
    })

    const paymentMethodMap: Record<string, string> = {
      'CARD': '신용카드',
      'BANK_TRANSFER': '계좌이체',
      'CASH': '현금',
      'VIRTUAL_ACCOUNT': '가상계좌',
      'PHONE': '휴대폰'
    }

    // TOP 인플루언서
    const topInfluencers = await prisma.user.findMany({
      where: {
        type: 'INFLUENCER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        applications: {
          where: {
            status: 'APPROVED',
            contents: {
              some: {
                status: 'APPROVED'
              }
            }
          },
          select: {
            campaign: {
              select: {
                budget: true
              }
            }
          }
        }
      },
      take: 5
    })

    const formattedInfluencers = topInfluencers.map(influencer => ({
      id: influencer.id,
      name: influencer.name,
      email: influencer.email,
      campaigns: influencer.applications.length,
      earnings: influencer.applications.reduce((sum, app) => sum + (app.campaign?.budget || 0) * 0.8, 0)
    })).sort((a, b) => b.earnings - a.earnings)

    // TOP 캠페인
    const topCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        title: true,
        budget: true,
        business: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        budget: 'desc'
      },
      take: 5
    })

    const formattedCampaigns = topCampaigns.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      business: campaign.business.name,
      revenue: campaign.budget,
      applications: campaign._count.applications
    }))

    return NextResponse.json({
      overview: {
        totalUsers,
        totalCampaigns,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalSettlements: totalSettlements._sum.totalAmount || 0,
        userGrowth,
        revenueGrowth
      },
      userStats: {
        byType: usersByType.map(item => ({
          type: item.type === 'INFLUENCER' ? '인플루언서' : item.type === 'BUSINESS' ? '비즈니스' : '관리자',
          count: item._count.id
        })),
        byMonth: usersByMonth
      },
      campaignStats: {
        byStatus: campaignsByStatus.map(item => ({
          status: item.status,
          count: item._count.id
        })),
        byCategory: Object.entries(categoryCount).map(([category, count]) => ({
          category,
          count
        })),
        byMonth: campaignsByMonth
      },
      revenueStats: {
        byMonth: revenueByMonth,
        byPaymentMethod: paymentMethods.map(item => ({
          method: paymentMethodMap[item.paymentMethod] || item.paymentMethod,
          amount: item._sum.amount || 0
        }))
      },
      topInfluencers: formattedInfluencers,
      topCampaigns: formattedCampaigns
    })
  } catch (error) {
    console.error('통계 데이터 조회 오류:', error)
    return NextResponse.json(
      { error: '통계 데이터 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}