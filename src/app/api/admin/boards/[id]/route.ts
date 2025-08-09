import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/admin/boards/[id] - 게시판 수정
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
    const { name, description, category, visibility, status, settings } = body

    // 게시판 업데이트
    const board = await prisma.board.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(visibility && { visibility }),
        ...(status && { status }),
        ...(settings && { settings }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '게시판이 수정되었습니다',
      board
    })
  } catch (error) {
    console.error('Failed to update board:', error)
    return NextResponse.json(
      { success: false, error: '게시판 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/boards/[id] - 게시판 삭제
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

    // 게시판과 관련 게시물 삭제
    await prisma.$transaction([
      // 댓글 삭제
      prisma.$executeRaw`
        DELETE FROM comments 
        WHERE post_id IN (SELECT id FROM posts WHERE board_id = ${params.id})
      `,
      // 좋아요 삭제
      prisma.$executeRaw`
        DELETE FROM likes 
        WHERE post_id IN (SELECT id FROM posts WHERE board_id = ${params.id})
      `,
      // 게시물 삭제
      prisma.post.deleteMany({
        where: { boardId: params.id }
      }),
      // 게시판 삭제
      prisma.board.delete({
        where: { id: params.id }
      })
    ])

    return NextResponse.json({
      success: true,
      message: '게시판이 삭제되었습니다'
    })
  } catch (error) {
    console.error('Failed to delete board:', error)
    return NextResponse.json(
      { success: false, error: '게시판 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}