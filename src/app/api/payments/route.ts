import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'
import { generateOrderId } from '@/lib/utils/order'

// POST /api/payments - 결제 요청 생성
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
    const { campaignId, amount, paymentMethod } = body

    // 필수 필드 검증
    if (!campaignId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 캠페인 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: true
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // 비즈니스 소유자 확인
    if (campaign.businessId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to pay for this campaign' },
        { status: 403 }
      )
    }

    // 중복 결제 확인
    const existingPayment = await prisma.payment.findFirst({
      where: {
        campaignId,
        userId: user.id,
        status: { in: ['PENDING', 'COMPLETED'] }
      }
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already exists for this campaign' },
        { status: 400 }
      )
    }

    // 결제 정보 생성
    const orderId = generateOrderId()
    
    const payment = await prisma.payment.create({
      data: {
        orderId,
        campaignId,
        userId: user.id,
        amount,
        type: 'CAMPAIGN_PAYMENT',
        status: 'PENDING',
        paymentMethod,
        metadata: JSON.stringify({
          campaignTitle: campaign.title,
          businessName: campaign.business.name
        })
      }
    })

    // 토스페이먼츠 클라이언트 키
    const clientKey = process.env.TOSS_CLIENT_KEY
    if (!clientKey) {
      console.error('TOSS_CLIENT_KEY is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // 결제 요청 정보
    const paymentRequest = {
      amount,
      orderId: payment.orderId,
      orderName: `${campaign.title} 캠페인 결제`,
      customerName: user.name || user.email,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/success`,
      failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/fail`
    }

    return NextResponse.json({
      success: true,
      clientKey,
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod
      },
      paymentRequest
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

// GET /api/payments - 결제 내역 조회
export async function GET(request: NextRequest) {
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

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      payments: payments.map(payment => ({
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        type: payment.type,
        campaign: payment.campaign,
        createdAt: payment.createdAt,
        approvedAt: payment.approvedAt
      }))
    })
  } catch (error) {
    console.error('Payment list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}