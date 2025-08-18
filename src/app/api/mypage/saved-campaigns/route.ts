import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/mypage/saved-campaigns - 사용자가 저장한 관심 캠페인 목록
export async function GET(request: NextRequest) {
  try {
    console.log('Saved campaigns API called')
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('Token exists:', !!token)
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user
    try {
      user = await verifyJWT(token)
      console.log('User verified:', user)
    } catch (error) {
      console.error('Token verification error:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const userId = user.userId || user.id
    console.log('User ID:', userId)
    
    if (!user || !userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 저장된 캠페인 목록 조회
    const savedCampaigns = await prisma.savedCampaign.findMany({
      where: {
        userId: userId
      },
      include: {
        campaign: {
          include: {
            business: {
              select: {
                businessProfile: {
                  select: {
                    companyName: true
                  }
                }
              }
            },
            _count: {
              select: {
                campaignLikes: true,
                applications: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found saved campaigns:', savedCampaigns.length)
    if (savedCampaigns.length > 0) {
      console.log('First campaign status:', savedCampaigns[0].campaign.status)
    }

    // 활성 상태의 캠페인만 필터링
    const campaigns = savedCampaigns
      .filter(save => save.campaign && ['ACTIVE', 'APPROVED', 'PENDING', 'DRAFT'].includes(save.campaign.status))
      .map(save => ({
        id: save.campaign.id,
        title: save.campaign.title,
        businessName: save.campaign.business.businessProfile?.companyName || 'Unknown',
        brand_name: save.campaign.business.businessProfile?.companyName || 'Unknown',
        category: '', // Campaign model doesn't have category field
        platform: save.campaign.platform || '',
        budget: save.campaign.budget,
        reward: save.campaign.budget || 0,
        image_url: save.campaign.imageUrl || '',
        imageUrl: save.campaign.imageUrl || '',
        requirements: save.campaign.requirements || '',
        application_deadline: save.campaign.endDate,
        startDate: save.campaign.startDate,
        endDate: save.campaign.endDate,
        likes: save.campaign._count.campaignLikes,
        applications: save.campaign._count.applications,
        savedAt: save.createdAt,
        status: save.campaign.status
      }))

    return NextResponse.json({
      campaigns,
      total: campaigns.length
    })
  } catch (error) {
    console.error('Error fetching saved campaigns:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
