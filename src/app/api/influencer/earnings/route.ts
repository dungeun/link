import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration
export const dynamic = 'force-dynamic'import { prisma } from '@/lib/db/prisma'

// Dynamic route configuration
export const dynamic = 'force-dynamic'import { authenticateRequest } from '@/lib/auth/middleware'

// Dynamic route configuration
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    const userId = (authResult as any).userId
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    // 인플루언서 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        type: 'INFLUENCER'
      },
      include: {
        profile: true,
        payments: {
          orderBy: {
            createdAt: 'desc'
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
            createdAt: 'desc'
          }
        },
        withdrawalAccount: true
      }
    })

    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json({ error: '인플루언서 프로필을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 수익 내역 형식화
    const earnings = user.payments
      .filter((payment: any) => payment.status === 'COMPLETED')
      .map((payment: any) => ({
        id: payment.id,
        campaignTitle: payment.campaign?.title || 'Unknown Campaign',
        brand: payment.campaign?.business?.name || 'Unknown Brand',
        amount: payment.amount,
        status: payment.status,
        date: payment.createdAt,
        settlementStatus: payment.settlement_status || 'PENDING'
      }))

    // 통계 계산
    const statistics = {
      totalEarnings: user.payments
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      pendingSettlement: user.payments
        .filter((p: any) => p.status === 'COMPLETED' && (!p.settlement_status || p.settlement_status === 'PENDING'))
        .reduce((sum: number, p: any) => sum + p.amount, 0),
      settledAmount: user.settlements
        .filter((s: any) => s.status === 'COMPLETED')
        .reduce((sum: number, s: any) => sum + s.totalAmount, 0),
      thisMonthEarnings: user.payments
        .filter((p: any) => {
          const paymentDate = new Date(p.createdAt)
          const now = new Date()
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear() &&
                 p.status === 'COMPLETED'
        })
        .reduce((sum: number, p: any) => sum + p.amount, 0)
    }

    // 계좌 정보
    const bankAccount = user.withdrawalAccount || null

    return NextResponse.json({
      earnings,
      statistics,
      bankAccount: bankAccount ? {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder
      } : null
    })
  } catch (error) {
    console.error('Failed to fetch earnings:', error)
    return NextResponse.json(
      { error: '수익 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    const userId = (authResult as any).userId
    if (!userId) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { bankName, accountNumber, accountHolder } = body

    // 계좌 정보 업데이트
    const account = await prisma.withdrawalAccount.upsert({
      where: { userId },
      update: {
        bankName,
        accountNumber,
        accountHolder
      },
      create: {
        userId,
        bankName,
        accountNumber,
        accountHolder
      }
    })

    return NextResponse.json({
      message: '계좌 정보가 업데이트되었습니다.',
      account: {
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder
      }
    })
  } catch (error) {
    console.error('Failed to update bank account:', error)
    return NextResponse.json(
      { error: '계좌 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}