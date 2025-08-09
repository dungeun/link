import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 구매평 요청 수수료율 (5%)
const REVIEW_REQUEST_FEE_RATE = 0.05

// GET /api/reviews/request - 구매평 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (user.type !== 'BUSINESS') {
      return NextResponse.json(
        { success: false, error: '비즈니스 계정만 접근 가능합니다' },
        { status: 403 }
      )
    }

    const where = {
      businessId: user.id,
      ...(campaignId ? { campaignId } : {})
    }

    const reviewRequests = await prisma.reviewRequest.findMany({
      where,
      include: {
        campaign: {
          select: {
            id: true,
            title: true
          }
        },
        influencer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      reviewRequests,
      total: reviewRequests.length
    })
  } catch (error) {
    console.error('Failed to get review requests:', error)
    return NextResponse.json(
      { success: false, error: '구매평 요청 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/request - 구매평 요청 생성
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    
    if (user.type !== 'BUSINESS') {
      return NextResponse.json(
        { success: false, error: '비즈니스 계정만 구매평을 요청할 수 있습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      campaignId,
      influencerIds,
      productName,
      purchaseLink,
      reviewPlatform,
      reviewDeadline,
      reviewGuidelines,
      rewardAmount
    } = body

    // 수수료 계산
    const feeAmount = rewardAmount * REVIEW_REQUEST_FEE_RATE
    const totalAmount = rewardAmount + feeAmount

    // 구매평 요청 생성 (각 인플루언서별로)
    const reviewRequests = await Promise.all(
      influencerIds.map(async (influencerId: string) => {
        const reviewRequest = await prisma.reviewRequest.create({
          data: {
            businessId: user.id,
            campaignId,
            influencerId,
            productName,
            purchaseLink,
            reviewPlatform,
            reviewDeadline: new Date(reviewDeadline),
            reviewGuidelines,
            rewardAmount,
            feeAmount,
            totalAmount,
            status: 'PENDING',
            isPaid: false
          }
        })

        // 알림 생성
        await prisma.notification.create({
          data: {
            userId: influencerId,
            type: 'REVIEW_REQUEST',
            title: '구매평 작성 요청',
            message: `${productName}에 대한 구매평 작성을 요청받았습니다`,
            relatedId: reviewRequest.id
          }
        })

        return reviewRequest
      })
    )

    // 결제 요청 생성 (수수료 결제)
    const payment = await prisma.payment.create({
      data: {
        businessId: user.id,
        campaignId,
        amount: influencerIds.length * feeAmount,
        type: 'REVIEW_FEE',
        status: 'PENDING',
        description: `구매평 요청 수수료 (${influencerIds.length}명)`
      }
    })

    return NextResponse.json({
      success: true,
      message: '구매평 요청이 생성되었습니다',
      reviewRequests,
      payment: {
        id: payment.id,
        amount: payment.amount,
        description: payment.description
      }
    })
  } catch (error) {
    console.error('Failed to create review request:', error)
    return NextResponse.json(
      { success: false, error: '구매평 요청 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PATCH /api/reviews/request/:id - 구매평 요청 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    const { pathname } = new URL(request.url)
    const requestId = pathname.split('/').pop()
    const body = await request.json()
    const { status, reviewUrl, reviewNotes } = body

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: '요청 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 구매평 요청 조회
    const reviewRequest = await prisma.reviewRequest.findUnique({
      where: { id: requestId }
    })

    if (!reviewRequest) {
      return NextResponse.json(
        { success: false, error: '구매평 요청을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 권한 확인 (인플루언서 본인 또는 요청한 비즈니스)
    if (user.id !== reviewRequest.influencerId && user.id !== reviewRequest.businessId) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      )
    }

    // 상태 업데이트
    const updatedRequest = await prisma.reviewRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(reviewUrl ? { reviewUrl } : {}),
        ...(reviewNotes ? { reviewNotes } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {})
      }
    })

    // 완료 시 비즈니스에게 알림
    if (status === 'COMPLETED') {
      await prisma.notification.create({
        data: {
          userId: reviewRequest.businessId,
          type: 'REVIEW_COMPLETED',
          title: '구매평이 작성되었습니다',
          message: `${reviewRequest.productName}에 대한 구매평이 완료되었습니다`,
          relatedId: requestId
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: '구매평 요청이 업데이트되었습니다',
      reviewRequest: updatedRequest
    })
  } catch (error) {
    console.error('Failed to update review request:', error)
    return NextResponse.json(
      { success: false, error: '구매평 요청 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}