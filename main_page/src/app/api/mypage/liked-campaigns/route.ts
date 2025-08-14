import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/mypage/liked-campaigns - 사용자가 좋아요한 캠페인 목록
export async function GET(request: NextRequest) {
  try {
    console.log('Liked campaigns API called')
    
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

    // 좋아요한 캠페인 목록 조회
    const likedCampaigns = await prisma.campaignLike.findMany({
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

    console.log('Found liked campaigns:', likedCampaigns.length)
    if (likedCampaigns.length > 0) {
      console.log('First campaign status:', likedCampaigns[0].campaign.status)
    }

    // 모든 상태의 캠페인 포함 (ACTIVE, APPROVED, PENDING 등)
    const campaigns = likedCampaigns
      .filter(like => like.campaign && ['ACTIVE', 'APPROVED', 'PENDING', 'DRAFT'].includes(like.campaign.status))
      .map(like => ({
        id: like.campaign.id,
        title: like.campaign.title,
        brand_name: like.campaign.business.businessProfile?.companyName || 'Unknown',
        category: '', // Campaign model doesn't have category field
        platform: like.campaign.platform || '',
        budget: like.campaign.budget,
        image_url: like.campaign.imageUrl || '',
        requirements: like.campaign.requirements || '',
        application_deadline: like.campaign.endDate, // applicationDeadline doesn't exist
        likes: like.campaign._count.campaignLikes,
        applications: like.campaign._count.applications,
        likedAt: like.createdAt,
        status: like.campaign.status
      }))

    return NextResponse.json({
      campaigns,
      total: campaigns.length
    })
  } catch (error) {
    console.error('Error fetching liked campaigns:', error)
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