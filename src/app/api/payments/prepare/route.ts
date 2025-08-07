import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

// POST /api/payments/prepare - 토스페이먼츠 결제 준비
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
      customerEmail,
      campaignId,
      method = 'CARD' // CARD, TRANSFER, VIRTUAL_ACCOUNT, MOBILE_PHONE
    } = body;

    // 필수 필드 검증
    if (!orderId || !amount || !orderName) {
      return NextResponse.json(
        { error: '필수 결제 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 결제 정보 데이터베이스에 임시 저장
    const payment = await prisma.payment.create({
      data: {
        orderId,
        campaignId,
        userId: user.id,
        amount,
        type: 'CAMPAIGN_FEE',
        status: 'PENDING',
        paymentMethod: method,
        metadata: JSON.stringify({
          orderName,
          customerName,
          customerEmail,
          tossPayment: true
        })
      }
    });

    // 토스페이먼츠 결제창 정보 생성
    const paymentData = {
      amount,
      orderId,
      orderName,
      customerName: customerName || user.name || '고객',
      customerEmail: customerEmail || user.email,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/success`,
      failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/callback/fail`,
      clientKey: TOSS_CLIENT_KEY,
      // 결제 방법별 설정
      ...(method === 'CARD' && {
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false
        }
      }),
      ...(method === 'TRANSFER' && {
        transfer: {
          cashReceipt: {
            type: '소득공제'
          }
        }
      }),
      ...(method === 'MOBILE_PHONE' && {
        mobilePhone: {
          cashReceipt: {
            type: '소득공제'
          }
        }
      })
    };

    return NextResponse.json({
      message: '결제 준비가 완료되었습니다.',
      paymentData,
      paymentId: payment.id
    });
  } catch (error) {
    const { logError } = await import('@/lib/utils/logger');
    logError(error, '결제 준비 오류');
    return NextResponse.json(
      { error: '결제 준비에 실패했습니다.' },
      { status: 500 }
    );
  }
}