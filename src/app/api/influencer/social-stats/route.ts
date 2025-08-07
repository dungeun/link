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
        socialAccounts: true
      }
    })

    if (!influencer) {
      return NextResponse.json({ error: '인플루언서 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 소셜 계정별 팔로워 수 조회
    const socialStats = {
      instagram: 0,
      youtube: 0,
      tiktok: 0,
      blog: 0,
      total: 0
    }

    // 실제 SNS API 연동이 필요한 부분
    // 현재는 DB에 저장된 팔로워 수를 반환
    for (const account of influencer.socialAccounts) {
      const platform = account.platform.toLowerCase()
      if (platform in socialStats) {
        socialStats[platform as keyof typeof socialStats] = account.followerCount || 0
        socialStats.total += account.followerCount || 0
      }
    }

    // 마지막 업데이트 시간
    const lastUpdated = influencer.socialAccounts.reduce((latest, account) => {
      const accountUpdated = account.updatedAt || account.createdAt
      return accountUpdated > latest ? accountUpdated : latest
    }, new Date(0))

    return NextResponse.json({
      socialStats,
      lastUpdated,
      profileId: influencer.id
    })
  } catch (error) {
    console.error('Social stats API error:', error)
    return NextResponse.json(
      { error: '소셜 통계를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 팔로워 수 업데이트 (SNS API 연동 시 사용)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await authenticateRequest(request)
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, followerCount, accountId } = body

    if (!platform || followerCount === undefined || !accountId) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 소셜 계정 업데이트
    const updatedAccount = await prisma.socialAccount.update({
      where: {
        id: accountId,
        influencer: {
          user_id: userId
        }
      },
      data: {
        followerCount: followerCount,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      account: updatedAccount
    })
  } catch (error) {
    console.error('Update social stats error:', error)
    return NextResponse.json(
      { error: '팔로워 수 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}