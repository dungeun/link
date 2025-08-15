import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Note: Board model is not currently defined in the Prisma schema
// This endpoint is a placeholder and will return 501 Not Implemented

// GET /api/admin/boards/[id]/posts - 게시판의 게시물 목록 조회
export async function GET(
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

    // Board model not implemented
    return NextResponse.json(
      { success: false, error: 'Board functionality not implemented' },
      { status: 501 }
    )
  } catch (error) {
    console.error('Failed to get posts:', error)
    return NextResponse.json(
      { success: false, error: '게시물 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}