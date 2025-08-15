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
      where: { 
        id: campaignId,
        deletedAt: null // 삭제되지 않은 캠페인만 조회
      },
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
      platformFeeRate: 'platformFeeRate' in campaign && typeof campaign.platformFeeRate === 'number' ? campaign.platformFeeRate : 0.2
    }

    return NextResponse.json({
      success: true,
      campaign: {
        ...formattedCampaign,
        mainCategory: campaign.mainCategory || '캠페인'
      }
    })

  } catch (error) {
    console.error('Campaign detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: 캠페인 정보 업데이트 (카테고리 포함)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('PUT /api/admin/campaigns/[id] called with:', params.id)
  
  try {
    // 관리자 인증 확인
    console.log('🔐 Checking admin auth...')
    console.log('🔐 Request headers:', JSON.stringify([...request.headers.entries()], null, 2))
    
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      console.log('❌ Auth failed')
      console.log('❌ Auth error response:', authResult.error)
      return authResult.error
    }
    console.log('✅ Auth passed for user:', authResult.user?.email)
    console.log('✅ User type:', authResult.user?.type)

    const body = await request.json()
    console.log('Request body:', body)
    const { mainCategory, category } = body

    // 캠페인 존재 여부 확인
    console.log('Finding campaign:', params.id)
    const existingCampaign = await prisma.campaign.findUnique({
      where: { 
        id: params.id,
        deletedAt: null // 삭제되지 않은 캠페인만
      }
    })

    if (!existingCampaign) {
      console.log('Campaign not found:', params.id)
      return NextResponse.json(
        { success: false, error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('Found campaign:', existingCampaign.title)

    // 캠페인 업데이트
    console.log('Updating campaign with:', {
      mainCategory: mainCategory || '캠페인',
      category: category || null
    })
    
    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        mainCategory: mainCategory || '캠페인',
        category: category || null
      }
    })

    console.log('Campaign updated successfully')
    return NextResponse.json({
      success: true,
      message: '캠페인 카테고리가 성공적으로 업데이트되었습니다.',
      campaign: updatedCampaign
    })
  } catch (error) {
    console.error('❌ 캠페인 업데이트 오류:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    
    console.error('❌ Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    })
    return NextResponse.json(
      { success: false, error: `서버 오류: ${errorMessage}`, details: errorStack },
      { status: 500 }
    )
  }
}

// DELETE: 캠페인 소프트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      return authResult.error
    }

    const campaignId = params.id

    // 캠페인 존재 여부 확인
    const existingCampaign = await prisma.campaign.findUnique({
      where: { 
        id: campaignId,
        deletedAt: null // 이미 삭제된 캠페인은 제외
      }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 소프트 삭제 (deletedAt 필드에 현재 시간 설정)
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '캠페인이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('캠페인 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}