import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

// POST /api/admin/campaigns/[id]/approve - 캠페인 승인
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== Campaign Approve API Called ===')
    console.log('Campaign ID:', params.id)
    
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      console.log('Auth failed:', authResult.error)
      return authResult.error
    }
    const { user: admin } = authResult
    console.log('Admin user:', { id: admin.id, email: admin.email, type: admin.type })

    const campaignId = params.id

    // 캠페인 조회
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        business: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })
    
    if (!campaign) {
      console.log('Campaign not found:', campaignId)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    console.log('Existing campaign:', { 
      id: campaign.id, 
      status: campaign.status, 
      title: campaign.title,
      isPaid: campaign.isPaid 
    })

    // PENDING_REVIEW 상태가 아닌 경우 에러
    if (campaign.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { 
          error: 'Invalid campaign status', 
          message: `Campaign must be in PENDING_REVIEW status. Current status: ${campaign.status}` 
        },
        { status: 400 }
      )
    }

    // 결제 확인
    if (!campaign.isPaid) {
      return NextResponse.json(
        { 
          error: 'Campaign not paid', 
          message: 'Campaign must be paid before approval' 
        },
        { status: 400 }
      )
    }

    // 트랜잭션으로 캠페인 승인 처리
    const result = await prisma.$transaction(async (tx) => {
      // 캠페인 상태를 ACTIVE로 변경
      const updatedCampaign = await tx.campaign.update({
        where: { id: campaignId },
        data: { 
          status: 'ACTIVE',
          reviewedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // 비즈니스에게 승인 알림 생성
      await tx.notification.create({
        data: {
          userId: campaign.businessId,
          type: 'CAMPAIGN_APPROVED',
          title: '캠페인이 승인되었습니다',
          message: `"${campaign.title}" 캠페인이 승인되어 활성화되었습니다.`,
          actionUrl: `/business/campaigns/${campaign.id}`,
          metadata: JSON.stringify({
            campaignId: campaign.id,
            approvedBy: admin.id,
            approvedAt: new Date().toISOString()
          })
        }
      })

      // 관리 로그 기록 (나중에 감사 추적용)
      console.log('Campaign approved:', {
        campaignId: campaign.id,
        approvedBy: admin.id,
        approvedAt: new Date().toISOString(),
        businessEmail: campaign.business.email
      })

      return updatedCampaign
    })
    
    console.log('Campaign approved successfully:', { 
      id: result.id, 
      newStatus: result.status 
    })

    return NextResponse.json({
      success: true,
      campaign: result,
      message: 'Campaign approved successfully'
    })

  } catch (error) {
    console.error('=== Campaign Approve Error ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Campaign ID:', params.id)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}