import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

// POST /api/admin/campaigns/[id]/reject - 캠페인 거절
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== Campaign Reject API Called ===')
    console.log('Campaign ID:', params.id)
    
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      console.log('Auth failed:', authResult.error)
      return authResult.error
    }
    const { user: admin } = authResult
    console.log('Admin user:', { id: admin.id, email: admin.email, type: admin.type })

    const body = await request.json()
    const { reason } = body
    const campaignId = params.id

    // 거절 사유 필수
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

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
        },
        payments: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
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

    // 트랜잭션으로 캠페인 거절 처리
    const result = await prisma.$transaction(async (tx) => {
      // 캠페인 상태를 REJECTED로 변경
      const updatedCampaign = await tx.campaign.update({
        where: { id: campaignId },
        data: { 
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewFeedback: reason,
          updatedAt: new Date()
        }
      })

      // 비즈니스에게 거절 알림 생성
      await tx.notification.create({
        data: {
          userId: campaign.businessId,
          type: 'CAMPAIGN_REJECTED',
          title: '캠페인이 거절되었습니다',
          message: `"${campaign.title}" 캠페인이 거절되었습니다. 사유: ${reason}`,
          actionUrl: `/business/campaigns/${campaign.id}`,
          metadata: JSON.stringify({
            campaignId: campaign.id,
            rejectedBy: admin.id,
            rejectedAt: new Date().toISOString(),
            reason: reason
          })
        }
      })

      // 결제가 있었다면 환불 처리 대기 상태로 기록
      if (campaign.isPaid && campaign.payments.length > 0) {
        const lastPayment = campaign.payments[0]
        
        // 환불 대기 알림 생성 (비즈니스용)
        await tx.notification.create({
          data: {
            userId: campaign.businessId,
            type: 'REFUND_PENDING',
            title: '환불 처리 안내',
            message: `거절된 캠페인 "${campaign.title}"의 결제 금액이 환불 처리될 예정입니다.`,
            actionUrl: `/business/payments`,
            metadata: JSON.stringify({
              campaignId: campaign.id,
              paymentId: lastPayment.id,
              amount: lastPayment.amount
            })
          }
        })

        // 환불 처리 필요 알림 (관리자용)
        const admins = await tx.user.findMany({
          where: { type: 'ADMIN' },
          select: { id: true }
        })

        for (const adminUser of admins) {
          await tx.notification.create({
            data: {
              userId: adminUser.id,
              type: 'REFUND_REQUIRED',
              title: '환불 처리 필요',
              message: `거절된 캠페인 "${campaign.title}"의 환불 처리가 필요합니다. 결제 금액: ${lastPayment.amount.toLocaleString()}원`,
              actionUrl: `/admin/payments?status=refund_pending`,
              metadata: JSON.stringify({
                campaignId: campaign.id,
                paymentId: lastPayment.id,
                amount: lastPayment.amount,
                businessEmail: campaign.business.email
              })
            }
          })
        }
      }

      // 관리 로그 기록 (나중에 감사 추적용)
      console.log('Campaign rejected:', {
        campaignId: campaign.id,
        rejectedBy: admin.id,
        rejectedAt: new Date().toISOString(),
        reason: reason,
        businessEmail: campaign.business.email,
        refundRequired: campaign.isPaid
      })

      return updatedCampaign
    })
    
    console.log('Campaign rejected successfully:', { 
      id: result.id, 
      newStatus: result.status,
      reason: reason 
    })

    return NextResponse.json({
      success: true,
      campaign: result,
      message: 'Campaign rejected successfully',
      refundRequired: campaign.isPaid
    })

  } catch (error) {
    console.error('=== Campaign Reject Error ===')
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