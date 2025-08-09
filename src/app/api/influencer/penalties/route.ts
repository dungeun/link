import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/influencer/penalties - 페널티 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const influencerId = searchParams.get('influencerId') || user.id
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // 페널티 조회 쿼리
    let whereClause = `WHERE influencer_id = $1`
    if (activeOnly) {
      whereClause += ` AND status = 'ACTIVE' AND (end_date IS NULL OR end_date > NOW())`
    }

    const penalties = await prisma.$queryRawUnsafe(`
      SELECT 
        ip.*,
        u.name as issued_by_name,
        c.title as campaign_title
      FROM influencer_penalties ip
      LEFT JOIN users u ON ip.issued_by = u.id
      LEFT JOIN campaigns c ON ip.campaign_id = c.id
      ${whereClause}
      ORDER BY ip.created_at DESC
    `, influencerId)

    // 활성 페널티 수 계산
    const activePenalties = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM influencer_penalties
      WHERE influencer_id = $1
        AND status = 'ACTIVE'
        AND (end_date IS NULL OR end_date > NOW())
    `, influencerId)

    return NextResponse.json({
      success: true,
      penalties,
      activePenaltyCount: parseInt(activePenalties[0]?.count || 0)
    })
  } catch (error) {
    console.error('Failed to get penalties:', error)
    return NextResponse.json(
      { success: false, error: '페널티 정보를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/influencer/penalties - 페널티 부과 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    
    // 관리자만 페널티 부과 가능
    if (user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '관리자만 페널티를 부과할 수 있습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      influencerId,
      penaltyType,
      severity,
      reason,
      endDate,
      campaignId
    } = body

    // 페널티 생성
    await prisma.$executeRaw`
      INSERT INTO influencer_penalties (
        id,
        influencer_id,
        issued_by,
        penalty_type,
        severity,
        reason,
        end_date,
        campaign_id,
        status,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid()::text,
        ${influencerId},
        ${user.id},
        ${penaltyType},
        ${severity},
        ${reason},
        ${endDate || null},
        ${campaignId || null},
        'ACTIVE',
        NOW(),
        NOW()
      )
    `

    // 알림 생성
    await prisma.notification.create({
      data: {
        userId: influencerId,
        type: 'PENALTY_ISSUED',
        title: '페널티가 부과되었습니다',
        message: `사유: ${reason}`,
        relatedId: campaignId
      }
    })

    return NextResponse.json({
      success: true,
      message: '페널티가 성공적으로 부과되었습니다'
    })
  } catch (error) {
    console.error('Failed to create penalty:', error)
    return NextResponse.json(
      { success: false, error: '페널티 부과 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PATCH /api/influencer/penalties/:id - 페널티 상태 업데이트 (관리자 전용)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    
    // 관리자만 페널티 수정 가능
    if (user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: '관리자만 페널티를 수정할 수 있습니다' },
        { status: 403 }
      )
    }

    const { pathname } = new URL(request.url)
    const penaltyId = pathname.split('/').pop()
    const body = await request.json()
    const { status, resolutionNotes } = body

    if (!penaltyId) {
      return NextResponse.json(
        { success: false, error: '페널티 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 페널티 상태 업데이트
    await prisma.$executeRaw`
      UPDATE influencer_penalties
      SET 
        status = ${status},
        resolved_at = ${status === 'RESOLVED' ? new Date() : null},
        resolved_by = ${status === 'RESOLVED' ? user.id : null},
        resolution_notes = ${resolutionNotes || null},
        updated_at = NOW()
      WHERE id = ${penaltyId}
    `

    return NextResponse.json({
      success: true,
      message: '페널티 상태가 업데이트되었습니다'
    })
  } catch (error) {
    console.error('Failed to update penalty:', error)
    return NextResponse.json(
      { success: false, error: '페널티 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}