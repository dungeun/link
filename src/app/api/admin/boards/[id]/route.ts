import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAuth } from '@/lib/auth-middleware'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boardId = params.id

    // Prisma 트랜잭션으로 안전하게 처리
    const result = await prisma.$transaction(async (tx) => {
      // 게시판의 모든 게시물 ID 가져오기
      const posts = await tx.post.findMany({
        where: { boardId: boardId },
        select: { id: true }
      })

      const postIds = posts.map(p => p.id)

      if (postIds.length > 0) {
        // 댓글 삭제
        await tx.comment.deleteMany({
          where: { postId: { in: postIds } }
        })

        // 좋아요 삭제
        await tx.postLike.deleteMany({
          where: { postId: { in: postIds } }
        })

        // 첨부파일 삭제
        await tx.attachment.deleteMany({
          where: { postId: { in: postIds } }
        })

        // 게시물 삭제
        await tx.post.deleteMany({
          where: { boardId: boardId }
        })
      }

      // 게시판 삭제
      const deletedBoard = await tx.board.delete({
        where: { id: boardId }
      })

      return deletedBoard
    })

    return NextResponse.json({ 
      message: 'Board and all related data deleted successfully',
      id: result.id 
    })

  } catch (error) {
    console.error('Error deleting board:', error)
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const boardId = params.id

    // 입력 검증
    if (!body.name) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      )
    }

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        name: body.name,
        description: body.description,
        isPublic: body.isPublic ?? true,
        isActive: body.isActive ?? true,
        order: body.order,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedBoard)

  } catch (error) {
    console.error('Error updating board:', error)
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    )
  }
}