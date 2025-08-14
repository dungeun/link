import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

// POST /api/payments/test-complete - 테스트 결제 완료 처리 (현금 결제)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    
    if (!token || token === '') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await verifyJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, paymentKey, amount } = body

    // 결제 정보 조회
    const payment = await prisma.payment.findFirst({
      where: { 
        orderId,
        userId: user.id
      },
      include: {
        campaign: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // 결제 금액 검증
    if (payment.amount !== amount) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // 이미 완료된 결제인지 확인
    if (payment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payment already completed' },
        { status: 400 }
      )
    }

    // 결제 정보 업데이트
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paymentKey,
        approvedAt: new Date(),
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          testPayment: true,
          testPaymentKey: paymentKey
        })
      }
    })

    // 캠페인 상태 업데이트 (isPaid = true)
    await prisma.campaign.update({
      where: { id: payment.campaignId },
      data: {
        isPaid: true,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      campaignId: payment.campaignId,
      paymentId: payment.id
    })
  } catch (error) {
    console.error('Test payment complete error:', error)
    return NextResponse.json(
      { error: 'Failed to complete test payment' },
      { status: 500 }
    )
  }
}