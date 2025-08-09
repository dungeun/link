import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// PATCH /api/admin/posts/[id]/status - 게시물 상태 변경
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

    if (!['PUBLISHED', 'DRAFT', 'HIDDEN'].includes(status)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 상태입니다' },
        { status: 400 }
      )
    }

    // 게시물 상태 업데이트
    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date()
      }
    })

    // 게시물 작성자에게 알림 (숨김 처리된 경우)
    if (status === 'HIDDEN') {
      const postDetails = await prisma.post.findUnique({
        where: { id: params.id },
        select: { authorId: true, title: true }
      })

      if (postDetails?.authorId) {
        await prisma.notification.create({
          data: {
            userId: postDetails.authorId,
            type: 'POST_HIDDEN',
            title: '게시물이 숨김 처리되었습니다',
            message: `"${postDetails.title}" 게시물이 관리자에 의해 숨김 처리되었습니다`,
            relatedId: params.id
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: '게시물 상태가 변경되었습니다',
      post
    })
  } catch (error) {
    console.error('Failed to update post status:', error)
    return NextResponse.json(
      { success: false, error: '게시물 상태 변경 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}