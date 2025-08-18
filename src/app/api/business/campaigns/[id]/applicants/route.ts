import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from '@/lib/auth/session'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 세션 확인
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // 캠페인 존재 여부 및 소유권 확인
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        businessId: session.user.id
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 지원자 목록 조회
    const applications = await prisma.campaignApplication.findMany({
      where: {
        campaignId,
        deletedAt: null
      },
      include: {
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

    // 데이터 형식 변환
    const applicants = applications.map(app => ({
      id: app.id,
      campaignId: app.campaignId,
      campaignTitle: campaign.title,
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
    console.error('Error fetching applicants:', error)
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