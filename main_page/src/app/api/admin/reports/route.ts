import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    try {
      const payload = await verifyJWT(token)
      if (!payload?.userId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = payload.userId
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { type: true }
    })

    if (!user || user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // 필터 조건 구성
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    
    if (type && type !== 'all') {
      where.type = type.toUpperCase()
    }
    
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reporter: { name: { contains: search, mode: 'insensitive' } } },
        { reporter: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // 신고 목록 조회
    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.report.count({ where })
    ])

    // 응답 데이터 포맷팅
    const formattedReports = reports.map(report => ({
      id: report.id,
      type: report.type.toLowerCase(),
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      status: report.status.toLowerCase(),
      adminNotes: report.adminNotes,
      reporter: {
        id: report.reporter.id,
        name: report.reporter.name,
        email: report.reporter.email,
        type: report.reporter.type.toLowerCase()
      },
      createdAt: report.createdAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString(),
      resolvedBy: report.resolvedBy
    }))

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    try {
      const payload = await verifyJWT(token)
      if (!payload?.userId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = payload.userId
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { type, targetId, targetType, reason, description } = body

    // 필수 필드 검증
    if (!type || !targetId || !targetType || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 신고 생성
    const report = await prisma.report.create({
      data: {
        type: type.toUpperCase(),
        targetId,
        reason,
        description,
        reporterId: userId
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        type: report.type.toLowerCase(),
          status: report.status.toLowerCase()
      }
    })

  } catch (error) {
    console.error('Failed to create report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}