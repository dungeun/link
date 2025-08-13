import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/payments - 결제 목록 조회
export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터 처리
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // 필터 조건 구성
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    
    if (method && method !== 'all') {
      where.paymentMethod = method.toUpperCase()
    }
    
    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { campaign: { title: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // 결제 목록 조회
    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true
          }
        },
        campaign: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    })

    // 총 개수 조회
    const total = await prisma.payment.count({ where })

    // 통계 정보 계산
    const stats = await prisma.payment.aggregate({
      _sum: {
        amount: true,
        refundedAmount: true
      },
      where: {}
    })

    const completedStats = await prisma.payment.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: 'COMPLETED'
      }
    })

    const pendingStats = await prisma.payment.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalAmount: stats._sum.amount || 0,
        completedAmount: completedStats._sum.amount || 0,
        pendingAmount: pendingStats._sum.amount || 0,
        refundedAmount: stats._sum.refundedAmount || 0
      }
    })
  } catch (error) {
    console.error('결제 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '결제 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}