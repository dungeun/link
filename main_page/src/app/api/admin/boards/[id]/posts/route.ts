import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    // 게시물 목록 조회
    const posts = await prisma.$queryRaw`
      SELECT 
        p.*,
        u.name as author_name,
        COUNT(DISTINCT c.id) as comment_count,
        COUNT(DISTINCT l.id) as like_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN comments c ON p.id = c.post_id
      LEFT JOIN likes l ON p.id = l.post_id
      WHERE p.board_id = ${params.id}
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC
    `

    return NextResponse.json({
      success: true,
      posts: posts.map((post: any) => ({
        id: post.id,
        boardId: post.board_id,
        title: post.title,
        author: post.author_name || 'Unknown',
        status: post.status,
        viewCount: post.view_count || 0,
        likeCount: parseInt(post.like_count || 0),
        commentCount: parseInt(post.comment_count || 0),
        createdAt: post.created_at
      }))
    })
  } catch (error) {
    console.error('Failed to get posts:', error)
    return NextResponse.json(
      { success: false, error: '게시물 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}