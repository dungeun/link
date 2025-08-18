import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from '@/lib/auth/session'

// 동적 라우트로 설정 (cookies 사용)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('=== /api/business/applicants GET ===')
    
    // 세션 확인
    const session = await getServerSession()
    console.log('Session:', session)
    
    if (!session?.user) {
      console.log('No session found')
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    console.log('User ID:', session.user.id)
    console.log('User Type:', session.user.type)

    // 해당 비즈니스의 모든 캠페인 가져오기
    const campaigns = await prisma.campaign.findMany({
      where: {
        businessId: session.user.id
      },
      select: {
        id: true,
        title: true
      }
    })

    console.log('Found campaigns:', campaigns.length)
    campaigns.forEach(c => console.log(`  - ${c.title} (${c.id})`))

    if (campaigns.length === 0) {
      console.log('No campaigns found for this business')
      return NextResponse.json({
        applicants: [],
        total: 0
      })
    }

    // 모든 캠페인의 지원자 조회
    console.log('Searching for applications with campaign IDs:', campaigns.map(c => c.id))
    
    const applications = await prisma.campaignApplication.findMany({
      where: {
        campaignId: {
          in: campaigns.map(c => c.id)
        },
        deletedAt: null
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true
          }
        },
        influencer: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('Found applications:', applications.length)
    applications.forEach(app => {
      console.log(`  - ${app.influencer.name} applied to ${app.campaign.title}`)
    })

    // 데이터 형식 변환
    const applicants = applications.map(app => ({
      id: app.id,
      campaignId: app.campaignId,
      campaignTitle: app.campaign.title,
      message: app.message,
      proposedPrice: app.proposedPrice,
      status: app.status,
      createdAt: app.createdAt,
      influencerId: app.influencerId,
      influencerName: app.influencer.name,
      influencerHandle: app.influencer.profile?.instagram || app.influencer.profile?.youtube || '',
      followers: calculateTotalFollowers(app.influencer.profile),
      engagementRate: app.influencer.profile?.averageEngagementRate || 0,
      influencer: {
        id: app.influencer.id,
        name: app.influencer.name,
        email: app.influencer.email,
        phone: app.influencer.profile?.phone,
        profile: app.influencer.profile ? {
          profileImage: app.influencer.profile.profileImage,
          bio: app.influencer.profile.bio,
          instagram: app.influencer.profile.instagram,
          instagramFollowers: app.influencer.profile.instagramFollowers,
          youtube: app.influencer.profile.youtube,
          youtubeSubscribers: app.influencer.profile.youtubeSubscribers,
          facebook: app.influencer.profile.facebook,
          facebookFollowers: app.influencer.profile.facebookFollowers,
          twitter: app.influencer.profile.twitter,
          twitterFollowers: app.influencer.profile.twitterFollowers,
          tiktok: app.influencer.profile.tiktok,
          tiktokFollowers: app.influencer.profile.tiktokFollowers,
          naverBlog: app.influencer.profile.naverBlog,
          naverBlogFollowers: app.influencer.profile.naverBlogFollowers,
          averageEngagementRate: app.influencer.profile.averageEngagementRate,
          categories: app.influencer.profile.categories,
          gender: app.influencer.profile.gender
        } : null
      }
    }))

    return NextResponse.json({
      applicants,
      total: applicants.length
    })

  } catch (error) {
    console.error('Error fetching all applicants:', error)
    return NextResponse.json(
      { error: '지원자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

function calculateTotalFollowers(profile: any): number {
  if (!profile) return 0
  
  let total = 0
  if (profile.instagramFollowers) total += profile.instagramFollowers
  if (profile.youtubeSubscribers) total += profile.youtubeSubscribers
  if (profile.facebookFollowers) total += profile.facebookFollowers
  if (profile.twitterFollowers) total += profile.twitterFollowers
  if (profile.tiktokFollowers) total += profile.tiktokFollowers
  if (profile.naverBlogFollowers) total += profile.naverBlogFollowers
  
  return total
}
