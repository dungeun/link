import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAuth } from '@/lib/auth-utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.user.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id

    // Prisma의 안전한 트랜잭션 사용 - SQL 인젝션 방지
    const result = await prisma.$transaction(async (tx) => {
      // 댓글 삭제
      await tx.comment.deleteMany({
        where: { postId: postId }
      })

      // 좋아요 삭제
      await tx.postLike.deleteMany({
        where: { postId: postId }
      })

      // 첨부파일 삭제
      await tx.attachment.deleteMany({
        where: { postId: postId }
      })

      // 게시물 삭제
      const deletedPost = await tx.post.delete({
        where: { id: postId }
      })

      return deletedPost
    })

    return NextResponse.json({ 
      message: 'Post deleted successfully',
      id: result.id 
    })

  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
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
    const postId = params.id

    // 입력 검증
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: body.title,
        content: body.content,
        status: body.status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedPost)

  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}