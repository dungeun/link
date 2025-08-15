import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// DELETE /api/admin/posts/[id] - 게시물 삭제
export async function DELETE(
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

    // 게시물과 관련 데이터 삭제
    await prisma.$transaction([
      // 댓글 삭제
      prisma.$executeRaw`DELETE FROM comments WHERE post_id = ${params.id}`,
      // 좋아요 삭제
      prisma.$executeRaw`DELETE FROM likes WHERE post_id = ${params.id}`,
      // 첨부파일 삭제
      prisma.$executeRaw`DELETE FROM attachments WHERE post_id = ${params.id}`,
      // 게시물 삭제
      prisma.post.delete({
        where: { id: params.id }
      })
    ])

    return NextResponse.json({
      success: true,
      message: '게시물이 삭제되었습니다'
    })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json(
      { success: false, error: '게시물 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}