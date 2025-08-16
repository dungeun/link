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

    // 인플루언서 사용자 및 프로필 정보 조회
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        type: 'INFLUENCER'
      },
      include: {
        profile: true,
        socialAccounts: true
      }
    })

    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json({ error: '인플루언서 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 소셜 계정별 팔로워 수 조회
    const socialStats = {
      instagram: user.profile?.instagramFollowers || 0,
      youtube: user.profile?.youtubeSubscribers || 0,
      tiktok: user.profile?.tiktokFollowers || 0,
      blog: user.profile?.naverBlogFollowers || 0,
      total: 0
    }

    // 총 팔로워 수 계산
    socialStats.total = socialStats.instagram + socialStats.youtube + socialStats.tiktok + socialStats.blog

    // 소셜 계정 정보
    const socialAccounts = {
      instagram: user.profile?.instagram || null,
      youtube: user.profile?.youtube || null,
      tiktok: user.profile?.tiktok || null,
      blog: user.profile?.naverBlog || null
    }

    // 참여도 계산 (예시 데이터)
    const engagement = {
      averageRate: user.profile?.averageEngagementRate || 0,
      trend: 'stable', // 실제로는 과거 데이터와 비교 필요
      lastUpdated: user.profile?.snsLastUpdated || new Date()
    }

    return NextResponse.json({
      socialStats,
      socialAccounts,
      engagement,
      profile: {
        bio: user.profile?.bio || '',
        categories: user.profile?.categories || '',
        isVerified: user.profile?.isVerified || false
      }
    })
  } catch (error) {
    console.error('Failed to fetch social stats:', error)
    return NextResponse.json(
      { error: '소셜 통계를 불러오는데 실패했습니다.' },
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
    const {
      instagram,
      instagramFollowers,
      youtube,
      youtubeSubscribers,
      tiktok,
      tiktokFollowers,
      naverBlog,
      naverBlogFollowers
    } = body

    // 프로필 업데이트
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        instagram,
        instagramFollowers: instagramFollowers ? parseInt(instagramFollowers) : undefined,
        youtube,
        youtubeSubscribers: youtubeSubscribers ? parseInt(youtubeSubscribers) : undefined,
        tiktok,
        tiktokFollowers: tiktokFollowers ? parseInt(tiktokFollowers) : undefined,
        naverBlog,
        naverBlogFollowers: naverBlogFollowers ? parseInt(naverBlogFollowers) : undefined,
        snsLastUpdated: new Date()
      },
      create: {
        userId,
        instagram,
        instagramFollowers: instagramFollowers ? parseInt(instagramFollowers) : 0,
        youtube,
        youtubeSubscribers: youtubeSubscribers ? parseInt(youtubeSubscribers) : 0,
        tiktok,
        tiktokFollowers: tiktokFollowers ? parseInt(tiktokFollowers) : 0,
        naverBlog,
        naverBlogFollowers: naverBlogFollowers ? parseInt(naverBlogFollowers) : 0,
        snsLastUpdated: new Date()
      }
    })

    return NextResponse.json({
      message: '소셜 계정 정보가 업데이트되었습니다.',
      profile
    })
  } catch (error) {
    console.error('Failed to update social stats:', error)
    return NextResponse.json(
      { error: '소셜 계정 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}