import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/campaigns/recommendations - 캠페인 추천
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const campaignId = searchParams.get('campaignId')
    const limit = parseInt(searchParams.get('limit') || '8')

    // 기본 조건: 활성 캠페인만
    const baseWhere = {
      status: 'ACTIVE',
      endDate: {
        gte: new Date()
      }
    }

    let recommendations = []

    if (category) {
      // 같은 카테고리 내에서 랜덤 추천
      const campaigns = await prisma.campaign.findMany({
        where: {
          ...baseWhere,
          OR: [
            { main_category: category },
            { 
              sub_categories: {
                contains: category
              }
            }
          ],
          NOT: campaignId ? { id: campaignId } : undefined
        },
        select: {
          id: true,
          title: true,
          brand: true,
          imageUrl: true,
          thumbnailImageUrl: true,
          budget: true,
          maxApplicants: true,
          endDate: true,
          main_category: true,
          sub_categories: true,
          viewCount: true,
          _count: {
            select: {
              applications: true,
              campaignLikes: true
            }
          }
        }
      })

      // 랜덤하게 섞기
      recommendations = campaigns
        .sort(() => Math.random() - 0.5)
        .slice(0, limit)
    } else {
      // 카테고리 없이 인기 캠페인 추천
      recommendations = await prisma.campaign.findMany({
        where: baseWhere,
        orderBy: [
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        select: {
          id: true,
          title: true,
          brand: true,
          imageUrl: true,
          thumbnailImageUrl: true,
          budget: true,
          maxApplicants: true,
          endDate: true,
          main_category: true,
          sub_categories: true,
          viewCount: true,
          _count: {
            select: {
              applications: true,
              campaignLikes: true
            }
          }
        }
      })
    }

    // 응답 포맷팅
    const formattedRecommendations = recommendations.map(campaign => ({
      id: campaign.id,
      title: campaign.title,
      brand: campaign.brand,
      imageUrl: campaign.thumbnailImageUrl || campaign.imageUrl,
      budget: campaign.budget,
      maxApplicants: campaign.maxApplicants,
      endDate: campaign.endDate,
      mainCategory: campaign.main_category,
      subCategories: campaign.sub_categories,
      viewCount: campaign.viewCount,
      applicationCount: campaign._count.applications,
      likeCount: campaign._count.campaignLikes,
      daysLeft: Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))

    return NextResponse.json({
      success: true,
      recommendations: formattedRecommendations,
      total: formattedRecommendations.length
    })
  } catch (error) {
    console.error('Failed to get recommendations:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '추천 캠페인을 불러오는 중 오류가 발생했습니다' 
      },
      { status: 500 }
    )
  }
}