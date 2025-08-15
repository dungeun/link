import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authService } from '@/lib/auth/services'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/influencer/withdrawal - 출금 계좌 정보 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 토큰 검증
    const tokenData = await authService.validateToken(accessToken)
    
    if (!tokenData || !tokenData.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // 사용자 타입 확인
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { type: true }
    })

    if (!user || (user.type !== 'INFLUENCER' && user.type !== 'USER')) {
      return NextResponse.json(
        { error: 'Not an influencer account' },
        { status: 403 }
      )
    }

    // 출금 계좌 정보 조회
    const withdrawalInfo = await prisma.withdrawalAccount.findUnique({
      where: { userId: tokenData.userId },
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: withdrawalInfo
    })
  } catch (error) {
    console.error('Get withdrawal account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get withdrawal account' },
      { status: 500 }
    )
  }
}

// POST /api/influencer/withdrawal - 출금 계좌 정보 저장/수정
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 토큰 검증
    const tokenData = await authService.validateToken(accessToken)
    
    if (!tokenData || !tokenData.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // 사용자 타입 확인
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: { type: true }
    })

    if (!user || (user.type !== 'INFLUENCER' && user.type !== 'USER')) {
      return NextResponse.json(
        { error: 'Not an influencer account' },
        { status: 403 }
      )
    }

    // 요청 데이터 파싱
    const body = await request.json()
    const { bankName, accountNumber, accountHolder } = body

    // 유효성 검사
    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 계좌번호 형식 검사 (숫자와 하이픈만 허용)
    const accountNumberRegex = /^[0-9-]+$/
    if (!accountNumberRegex.test(accountNumber)) {
      return NextResponse.json(
        { error: 'Invalid account number format' },
        { status: 400 }
      )
    }

    // 출금 계좌 정보 저장 또는 업데이트 (upsert)
    const withdrawalInfo = await prisma.withdrawalAccount.upsert({
      where: { userId: tokenData.userId },
      update: {
        bankName,
        accountNumber,
        accountHolder,
        updatedAt: new Date()
      },
      create: {
        userId: tokenData.userId,
        bankName,
        accountNumber,
        accountHolder
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal account saved successfully',
      data: {
        id: withdrawalInfo.id,
        bankName: withdrawalInfo.bankName,
        accountNumber: withdrawalInfo.accountNumber,
        accountHolder: withdrawalInfo.accountHolder
      }
    })
  } catch (error) {
    console.error('Save withdrawal account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save withdrawal account' },
      { status: 500 }
    )
  }
}

// DELETE /api/influencer/withdrawal - 출금 계좌 정보 삭제
export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const accessToken = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 토큰 검증
    const tokenData = await authService.validateToken(accessToken)
    
    if (!tokenData || !tokenData.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // 출금 계좌 정보 삭제
    await prisma.withdrawalAccount.deleteMany({
      where: { userId: tokenData.userId }
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal account deleted successfully'
    })
  } catch (error) {
    console.error('Delete withdrawal account error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete withdrawal account' },
      { status: 500 }
    )
  }
}