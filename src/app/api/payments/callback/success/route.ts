import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/payments/callback/success - 토스페이먼츠 결제 성공 콜백
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentKey = searchParams.get('paymentKey')
    const orderId = searchParams.get('orderId') 
    const amount = searchParams.get('amount')

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.redirect(
        new URL('/business/campaigns/new?error=invalid_payment', request.url)
      )
    }

    // 결제 정보 조회
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: {
        campaign: true
      }
    })

    if (!payment) {
      return NextResponse.redirect(
        new URL('/business/campaigns/new?error=payment_not_found', request.url)
      )
    }

    // 결제 금액 검증
    if (payment.amount !== parseInt(amount)) {
      return NextResponse.redirect(
        new URL('/business/campaigns/new?error=amount_mismatch', request.url)
      )
    }

    // 토스페이먼츠 결제 승인 API 호출
    const tossSecretKey = process.env.TOSS_SECRET_KEY
    if (!tossSecretKey) {
      console.error('TOSS_SECRET_KEY is not configured')
      return NextResponse.redirect(
        new URL('/business/campaigns/new?error=server_config_error', request.url)
      )
    }
    const base64SecretKey = Buffer.from(tossSecretKey + ':').toString('base64')

    const confirmResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64SecretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      })
    })

    if (!confirmResponse.ok) {
      const error = await confirmResponse.json()
      console.error('Payment confirm error:', error)
      return NextResponse.redirect(
        new URL('/business/campaigns/new?error=payment_confirm_failed', request.url)
      )
    }

    const confirmData = await confirmResponse.json()

    // 결제 정보 업데이트
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paymentKey,
        approvedAt: new Date(),
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || '{}'),
          tossPaymentData: confirmData
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

    // Revenue 기록 추가 (플랫폼 수수료)
    await prisma.revenue.create({
      data: {
        type: 'campaign_fee',
        amount: payment.amount * 0.1, // 플랫폼 수수료 10%
        referenceId: payment.id,
        description: `캠페인 수수료 - 토스페이먼츠`,
        metadata: {
          campaignId: payment.campaignId,
          paymentKey,
          paymentMethod: 'TOSS'
        }
      }
    })

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL(`/business/campaigns/${payment.campaignId}?payment=success`, request.url)
    )
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(
      new URL('/business/campaigns/new?error=callback_error', request.url)
    )
  }
}