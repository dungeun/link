import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/influencer/saved-campaigns - 관심 캠페인 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const user = await verifyJWT(token)
    
    // 저장된 캠페인 목록 조회
    const savedCampaigns = await prisma.savedCampaign.findMany({
      where: {
        userId: user.id
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 데이터 형식 변환
    const formattedCampaigns = savedCampaigns.map(saved => ({
      id: saved.campaign.id,
      title: saved.campaign.title,
      brand: saved.campaign.business.name,
      status: saved.campaign.status,
      savedAt: saved.createdAt,
      startDate: saved.campaign.startDate,
      endDate: saved.campaign.endDate,
      budget: saved.campaign.budget,
      platform: saved.campaign.platform,
      targetFollowers: saved.campaign.targetFollowers,
      category: saved.campaign.platform // 카테고리 대신 플랫폼 사용 (필요시 수정)
    }))

    return NextResponse.json({ savedCampaigns: formattedCampaigns })
  } catch (error) {
    console.error('관심 캠페인 조회 오류:', error)
    return NextResponse.json(
      { error: '관심 캠페인을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
