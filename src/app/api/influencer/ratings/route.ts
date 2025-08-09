import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/influencer/ratings - 인플루언서 평가 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const influencerId = searchParams.get('influencerId')
    
    if (!influencerId) {
      return NextResponse.json(
        { success: false, error: '인플루언서 ID가 필요합니다' },
        { status: 400 }
      )
    }

    // 평가 요약 조회
    const ratings = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_ratings,
        AVG(overall_score) as average_score,
        AVG(communication_score) as avg_communication,
        AVG(quality_score) as avg_quality,
        AVG(timeliness_score) as avg_timeliness,
        AVG(professionalism_score) as avg_professionalism,
        AVG(creativity_score) as avg_creativity
      FROM influencer_ratings
      WHERE influencer_id = ${influencerId}
    `

    // 최근 평가 목록
    const recentRatings = await prisma.$queryRaw`
      SELECT 
        ir.*,
        u.name as business_name,
        c.title as campaign_title
      FROM influencer_ratings ir
      JOIN users u ON ir.business_id = u.id
      JOIN campaigns c ON ir.campaign_id = c.id
      WHERE ir.influencer_id = ${influencerId}
      ORDER BY ir.created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      summary: ratings[0] || {
        total_ratings: 0,
        average_score: 0,
        avg_communication: 0,
        avg_quality: 0,
        avg_timeliness: 0,
        avg_professionalism: 0,
        avg_creativity: 0
      },
      recentRatings
    })
  } catch (error) {
    console.error('Failed to get ratings:', error)
    return NextResponse.json(
      { success: false, error: '평가 정보를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/influencer/ratings - 인플루언서 평가 등록
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }
    
    const { user } = authResult
    
    // 비즈니스 계정만 평가 가능
    if (user.type !== 'BUSINESS') {
      return NextResponse.json(
        { success: false, error: '비즈니스 계정만 평가를 등록할 수 있습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      influencerId,
      campaignId,
      communicationScore,
      qualityScore,
      timelinessScore,
      professionalismScore,
      creativityScore,
      reviewText
    } = body

    // 중복 평가 확인
    const existingRating = await prisma.$queryRaw`
      SELECT id FROM influencer_ratings
      WHERE influencer_id = ${influencerId}
        AND business_id = ${user.id}
        AND campaign_id = ${campaignId}
    `

    if (existingRating.length > 0) {
      return NextResponse.json(
        { success: false, error: '이미 평가를 등록하셨습니다' },
        { status: 400 }
      )
    }

    // 평가 등록
    await prisma.$executeRaw`
      INSERT INTO influencer_ratings (
        id,
        influencer_id,
        business_id,
        campaign_id,
        communication_score,
        quality_score,
        timeliness_score,
        professionalism_score,
        creativity_score,
        review_text,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid()::text,
        ${influencerId},
        ${user.id},
        ${campaignId},
        ${communicationScore},
        ${qualityScore},
        ${timelinessScore},
        ${professionalismScore},
        ${creativityScore},
        ${reviewText},
        NOW(),
        NOW()
      )
    `

    // 알림 생성
    await prisma.notification.create({
      data: {
        userId: influencerId,
        type: 'RATING_RECEIVED',
        title: '새로운 평가를 받았습니다',
        message: `캠페인에 대한 평가가 등록되었습니다`,
        relatedId: campaignId
      }
    })

    return NextResponse.json({
      success: true,
      message: '평가가 성공적으로 등록되었습니다'
    })
  } catch (error) {
    console.error('Failed to create rating:', error)
    return NextResponse.json(
      { success: false, error: '평가 등록 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}