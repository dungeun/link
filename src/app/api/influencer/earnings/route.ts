import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await authenticateRequest(request)
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    // 인플루언서 프로필 조회
    const influencer = await prisma.influencer.findUnique({
      where: { user_id: userId },
      include: {
        payments: {
          orderBy: {
            created_at: 'desc'
          },
          include: {
            campaign: {
              include: {
                business: true
              }
            }
          }
        },
        settlements: {
          orderBy: {
            created_at: 'desc'
          }
        },
        paymentAccounts: {
          where: {
            is_active: true
          }
        }
      }
    })

    if (!influencer) {
      return NextResponse.json({ error: '인플루언서 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 수익 내역 형식화
    const earnings = influencer.payments
      .filter(payment => payment.status === 'COMPLETED')
      .map(payment => ({
        id: payment.id,
        campaignTitle: payment.campaign?.title || 'Unknown Campaign',
        brand: payment.campaign?.business?.name || 'Unknown Brand',
        amount: payment.amount,
        status: payment.status,
        date: payment.created_at,
        settlementStatus: payment.settlement_status || 'PENDING'
      }))

    // 통계 계산
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0)
    
    const thisMonthEarnings = earnings
      .filter(earning => {
        const date = new Date(earning.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((sum, earning) => sum + earning.amount, 0)

    const pendingSettlement = earnings
      .filter(earning => earning.settlementStatus === 'PENDING')
      .reduce((sum, earning) => sum + earning.amount, 0)

    const availableBalance = influencer.available_balance || 0

    const stats = {
      totalEarnings,
      thisMonthEarnings,
      pendingSettlement,
      availableBalance
    }

    // 결제 계좌 정보
    const paymentAccounts = influencer.paymentAccounts.map(account => ({
      id: account.id,
      bankName: account.bank_name,
      accountNumber: account.account_number,
      accountHolder: account.account_holder,
      isDefault: account.is_default
    }))

    return NextResponse.json({
      earnings,
      stats,
      paymentAccounts
    })
  } catch (error) {
    console.error('Earnings API error:', error)
    return NextResponse.json(
      { error: '수익 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 출금 신청
export async function POST(request: NextRequest) {
  try {
    const { userId } = await authenticateRequest(request)
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, accountId } = body

    if (!amount || !accountId) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 인플루언서 및 잔액 확인
    const influencer = await prisma.influencer.findUnique({
      where: { user_id: userId }
    })

    if (!influencer) {
      return NextResponse.json({ error: '인플루언서 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    if ((influencer.available_balance || 0) < amount) {
      return NextResponse.json({ error: '출금 가능 금액이 부족합니다.' }, { status: 400 })
    }

    // 결제 계좌 확인
    const paymentAccount = await prisma.paymentAccount.findFirst({
      where: {
        id: accountId,
        influencer_id: influencer.id,
        is_active: true
      }
    })

    if (!paymentAccount) {
      return NextResponse.json({ error: '유효한 결제 계좌를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 출금 신청 생성
    const settlement = await prisma.settlement.create({
      data: {
        influencer_id: influencer.id,
        amount,
        bank_name: paymentAccount.bank_name,
        account_number: paymentAccount.account_number,
        account_holder: paymentAccount.account_holder,
        status: 'PENDING'
      }
    })

    // 잔액 차감
    await prisma.influencer.update({
      where: { id: influencer.id },
      data: {
        available_balance: {
          decrement: amount
        }
      }
    })

    return NextResponse.json({
      success: true,
      settlement
    })
  } catch (error) {
    console.error('Settlement request error:', error)
    return NextResponse.json(
      { error: '출금 신청에 실패했습니다.' },
      { status: 500 }
    )
  }
}