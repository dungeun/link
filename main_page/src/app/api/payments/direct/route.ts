import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// POST /api/payments/direct - 직접 결제 처리 (계좌이체)
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    const {
      orderId,
      amount,
      orderName,
      customerName,
      campaignId,
      method,
      status
    } = body;

    // 결제 정보 생성
    const payment = await prisma.payment.create({
      data: {
        orderId,
        campaignId,
        userId: user.id,
        amount,
        type: 'CAMPAIGN_FEE',
        status: status || 'COMPLETED',
        paymentMethod: method || 'TRANSFER',
        approvedAt: new Date(),
        metadata: JSON.stringify({
          orderName,
          customerName,
          directPayment: true
        })
      }
    });

    // 캠페인 상태 업데이트 (결제 완료)
    if (campaignId) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          isPaid: true,
          status: 'ACTIVE'
        }
      });

      // Revenue 기록 추가
      await prisma.revenue.create({
        data: {
          type: 'campaign_fee',
          amount: amount * 0.1, // 플랫폼 수수료 10%
          referenceId: payment.id,
          description: `캠페인 수수료 - ${orderName}`,
          metadata: {
            campaignId,
            paymentMethod: 'TRANSFER'
          }
        }
      });
    }

    return NextResponse.json({
      message: '결제가 완료되었습니다.',
      payment
    });
  } catch (error) {
    const { logError } = await import('@/lib/utils/logger');
    logError(error, '직접 결제 처리 오류');
    return NextResponse.json(
      { error: '결제 처리에 실패했습니다.' },
      { status: 500 }
    );
  }
}