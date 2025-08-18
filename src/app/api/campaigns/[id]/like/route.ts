import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db/prisma'

// Dynamic route configuration
import { verifyJWT } from '@/lib/auth/jwt'

// POST /api/campaigns/[id]/like - 캠페인 좋아요/취소
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user
    try {
      user = await verifyJWT(token)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const userId = user.userId || user.id
    if (!user || !userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 캠페인 존재 확인
    console.log('Checking campaign:', params.id)
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id }
    })
    console.log('Campaign found:', campaign)

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // 캠페인 상태 확인 (ACTIVE가 아닌 다른 상태일 수 있음)
    if (campaign.status !== 'ACTIVE' && campaign.status !== 'APPROVED' && campaign.status !== 'PENDING') {
      console.log('Campaign status:', campaign.status)
      return NextResponse.json({ error: 'Campaign is not available for likes' }, { status: 400 })
    }

    // 기존 좋아요 확인
    console.log('Checking existing like for user:', userId)
    
    const existingLike = await prisma.campaignLike.findUnique({
      where: {
        campaignId_userId: {
          campaignId: params.id,
          userId: userId
        }
      }
    })
    console.log('Existing like:', existingLike)

    let liked = false
    let likeCount = 0

    if (existingLike) {
      // 좋아요 취소
      await prisma.campaignLike.delete({
        where: { id: existingLike.id }
      })
      liked = false
    } else {
      // 좋아요 추가
      await prisma.campaignLike.create({
        data: {
          campaignId: params.id,
          userId: userId
        }
      })
      liked = true
    }

    // 총 좋아요 수 조회
    likeCount = await prisma.campaignLike.count({
      where: { campaignId: params.id }
    })

    return NextResponse.json({
      liked,
      likeCount
    })
  } catch (error) {
    console.error('Error toggling campaign like:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
