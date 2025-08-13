import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    const campaignId = params.id

    // 캠페인 상세 조회
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            businessProfile: {
              select: {
                companyName: true,
                businessNumber: true,
                representativeName: true,
                businessAddress: true,
                businessCategory: true
              }
            }
          }
        },
        applications: {
          include: {
            influencer: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: {
                  select: {
                    profileImage: true,
                    followerCount: true,
                    categories: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // 응답 데이터 포맷
    const formattedCampaign = {
      ...campaign,
      startDate: campaign.startDate.toISOString().split('T')[0],
      endDate: campaign.endDate.toISOString().split('T')[0],
      status: campaign.status.toLowerCase(),
      createdAt: campaign.createdAt.toISOString().split('T')[0],
      updatedAt: campaign.updatedAt.toISOString().split('T')[0],
      reviewedAt: null, // Campaign doesn't have reviewedAt field
      platformFeeRate: (campaign as any).platformFeeRate || 0.2
    }

    return NextResponse.json({
      campaign: formattedCampaign
    })

  } catch (error) {
    console.error('Campaign detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}