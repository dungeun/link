import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/admin/boards - 게시판 목록 조회
export async function GET(request: NextRequest) {
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

    // 게시판 목록 조회 (게시물 수 포함)
    const boards = await prisma.$queryRaw`
      SELECT 
        b.*,
        COUNT(p.id) as post_count,
        MAX(p.created_at) as last_post_at
      FROM boards b
      LEFT JOIN posts p ON b.id = p.board_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `

    return NextResponse.json({
      success: true,
      boards: boards.map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.description,
        category: board.category,
        status: board.status,
        visibility: board.visibility,
        postCount: parseInt(board.post_count || 0),
        lastPostAt: board.last_post_at,
        createdAt: board.created_at,
        updatedAt: board.updated_at
      }))
    })
  } catch (error) {
    console.error('Failed to get boards:', error)
    return NextResponse.json(
      { success: false, error: '게시판 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/admin/boards - 새 게시판 생성
export async function POST(request: NextRequest) {
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
    const { name, description, category, visibility } = body

    // 게시판 생성
    const board = await prisma.board.create({
      data: {
        name,
        description,
        category: category || 'community',
        visibility: visibility || 'PUBLIC',
        status: 'ACTIVE',
        settings: {
          allowComments: true,
          allowLikes: true,
          requireApproval: false,
          allowAttachments: true,
          maxAttachmentSize: 10485760, // 10MB
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: '게시판이 생성되었습니다',
      board
    })
  } catch (error) {
    console.error('Failed to create board:', error)
    return NextResponse.json(
      { success: false, error: '게시판 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}