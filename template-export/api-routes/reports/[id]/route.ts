import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      userId = payload.id
      
      // 관리자 권한 확인
      if (payload.type !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const reportId = params.id

    // 신고 상세 조회
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // 대상 정보 조회 (type에 따라 다른 테이블에서 조회)
    let targetInfo = null
    try {
      switch (report.type.toLowerCase()) {
        case 'user':
          targetInfo = await prisma.user.findUnique({
            where: { id: report.targetId },
            select: { id: true, name: true, email: true, type: true }
          })
          break
        case 'campaign':
          targetInfo = await prisma.campaign.findUnique({
            where: { id: report.targetId },
            select: { id: true, title: true, description: true }
          })
          break
        case 'content':
          // 추후 콘텐츠 테이블이 있을 때 구현
          break
      }
    } catch (error) {
      console.warn('Failed to fetch target info:', error)
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        type: report.type.toLowerCase(),
        reportedItemId: report.targetId,
        reportedItemTitle: (targetInfo as any)?.title || (targetInfo as any)?.name || report.targetId,
        reporterName: report.reporter.name,
        reporterEmail: report.reporter.email,
        targetUserName: (targetInfo as any)?.name || '알 수 없음',
        targetUserEmail: (targetInfo as any)?.email || '',
        reason: report.reason,
        description: report.description,
        status: report.status.toLowerCase(),
        priority: 'medium', // 기본 우선순위
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        assignedTo: report.resolvedBy,
        resolution: report.adminNotes,
        evidence: {
          screenshots: [],
          urls: [],
          additionalInfo: report.description
        },
        adminNotes: report.adminNotes
      }
    })

  } catch (error) {
    console.error('Report detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      userId = payload.id
      
      // 관리자 권한 확인
      if (payload.type !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { status, adminNotes, priority, resolution } = await request.json()
    const reportId = params.id

    // 신고 상태 업데이트
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (status) {
      updateData.status = status.toUpperCase()
      
      // 해결됨 상태로 변경시 추가 정보 저장
      if (status.toUpperCase() === 'RESOLVED' || status.toUpperCase() === 'REJECTED') {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = userId
      }
    }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes
    }
    
    // resolution이 있으면 adminNotes에 추가
    if (resolution !== undefined) {
      updateData.adminNotes = resolution
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      report: {
        ...updatedReport,
        type: updatedReport.type.toLowerCase(),
        status: updatedReport.status.toLowerCase(),
        reporter: {
          ...updatedReport.reporter,
          type: updatedReport.reporter.type.toLowerCase()
        }
      }
    })

  } catch (error) {
    console.error('Report status update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}