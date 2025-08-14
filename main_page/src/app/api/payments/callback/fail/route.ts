import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/payments/callback/fail - 토스페이먼츠 결제 실패 콜백
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const message = searchParams.get('message')
    const orderId = searchParams.get('orderId')

    // 결제 정보 업데이트 (실패 상태로)
    if (orderId) {
      const payment = await prisma.payment.findFirst({
        where: { orderId }
      })

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            metadata: JSON.stringify({
              ...JSON.parse(payment.metadata || '{}'),
              failureCode: code,
              failureMessage: message
            })
          }
        })

        // 캠페인 삭제 (결제 실패 시)
        await prisma.campaign.delete({
          where: { id: payment.campaignId }
        })
      }
    }

    // 실패 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL(
        `/business/campaigns/new?error=payment_failed&code=${code}&message=${encodeURIComponent(message || '결제에 실패했습니다')}`,
        request.url
      )
    )
  } catch (error) {
    console.error('Payment fail callback error:', error)
    return NextResponse.redirect(
      new URL('/business/campaigns/new?error=callback_error', request.url)
    )
  }
}