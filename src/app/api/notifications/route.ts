import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/notifications - 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where = {
      userId: user.id,
      ...(unreadOnly ? { isRead: false } : {})
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({ where })
    ])

    // 읽지 않은 알림 수
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      notifications,
      total,
      unreadCount,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Failed to get notifications:', error)
    return NextResponse.json(
      { success: false, error: '알림을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/notifications/mark-read - 알림 읽음 처리
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    const body = await request.json()
    const { notificationIds, markAll } = body

    if (markAll) {
      // 모든 알림 읽음 처리
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 선택된 알림만 읽음 처리
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: '알림이 읽음 처리되었습니다'
    })
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
    return NextResponse.json(
      { success: false, error: '알림 처리 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/:id - 알림 삭제
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    const { pathname } = new URL(request.url)
    const notificationId = pathname.split('/').pop()

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: '알림 ID가 필요합니다' },
        { status: 400 }
      )
    }

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: '알림이 삭제되었습니다'
    })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { success: false, error: '알림 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}