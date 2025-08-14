import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/payments/[id] - 특정 결제 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('authorization')
    let token = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get('auth-token')?.value
    }

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const payload = await verifyJWT(token)
    if (payload.type !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const paymentId = params.id

    // 결제 상세 정보 조회
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        campaign: true,
        refunds: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('결제 상세 조회 오류:', error)
    return NextResponse.json(
      { error: '결제 정보 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/payments/[id] - 결제 상태 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 인증 확인
    const authHeader = request.headers.get('authorization')
    let token = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get('auth-token')?.value
    }

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const payload = await verifyJWT(token)
    if (payload.type !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const paymentId = params.id
    const body = await request.json()
    const { status, failReason, refundAmount, refundReason } = body

    // 결제 정보 조회
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태별 업데이트 데이터 구성
    const updateData: any = {
      status: status.toUpperCase()
    }

    // 상태에 따른 추가 필드 업데이트
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        updateData.approvedAt = new Date()
        break
      case 'FAILED':
        updateData.failedAt = new Date()
        if (failReason) updateData.failReason = failReason
        break
      case 'REFUNDED':
        updateData.refundedAmount = refundAmount || payment.amount
        // 환불 기록 생성
        if (refundAmount || payment.amount) {
          await prisma.refund.create({
            data: {
              paymentId: paymentId,
              amount: refundAmount || payment.amount,
              reason: refundReason || '관리자 환불 처리',
              status: 'COMPLETED',
              processedAt: new Date()
            }
          })
        }
        break
      case 'PARTIAL_REFUNDED':
        if (refundAmount) {
          updateData.refundedAmount = payment.refundedAmount + refundAmount
          // 부분 환불 기록 생성
          await prisma.refund.create({
            data: {
              paymentId: paymentId,
              amount: refundAmount,
              reason: refundReason || '관리자 부분 환불 처리',
              status: 'COMPLETED',
              processedAt: new Date()
            }
          })
        }
        break
    }

    // 결제 정보 업데이트
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        user: true,
        campaign: true
      }
    })

    // 캠페인 상태 업데이트 (결제 완료 시)
    if (status.toUpperCase() === 'COMPLETED' && payment.campaignId) {
      await prisma.campaign.update({
        where: { id: payment.campaignId },
        data: {
          isPaid: true,
          status: 'ACTIVE'
        }
      })
    }

    return NextResponse.json({
      message: '결제 상태가 업데이트되었습니다.',
      payment: updatedPayment
    })
  } catch (error) {
    console.error('결제 업데이트 오류:', error)
    return NextResponse.json(
      { error: '결제 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}