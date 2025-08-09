import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/admin/boards/[id]/status - 게시판 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    
    // 관리자 권한 확인
    if (user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상태입니다' },
        { status: 400 }
      )
    }

    // 게시판 상태 업데이트
    const board = await prisma.board.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '게시판 상태가 변경되었습니다',
      board
    })
  } catch (error) {
    console.error('Failed to update board status:', error)
    return NextResponse.json(
      { success: false, error: '게시판 상태 변경 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}