import { NextRequest, NextResponse } from 'next/server'

// Dynamic route configuration
export const dynamic = 'force-dynamic'import { prisma } from '@/lib/db/prisma'

// Dynamic route configuration
export const dynamic = 'force-dynamic'import { getServerSession } from '@/lib/auth/session'

// Dynamic route configuration
export const dynamic = 'force-dynamic'// import { AppError } from '@/lib/errors/application-errors'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; applicantId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id: campaignId, applicantId } = params
    const { status } = await req.json()

    // 유효한 상태값 확인
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다.' },
        { status: 400 }
      )
    }

    // 캠페인 소유자 확인
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        businessId: true,
        title: true 
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (campaign.businessId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 지원 정보 확인
    const application = await prisma.campaignApplication.findUnique({
      where: { 
        id: applicantId,
        campaignId: campaignId
      },
      include: {
        influencer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: '지원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 업데이트
    const updatedApplication = await prisma.campaignApplication.update({
      where: { id: applicantId },
      data: { 
        status,
        reviewedAt: new Date()
      }
    })

    // 알림 메시지 설정
    let notificationTitle = ''
    let notificationMessage = ''

    switch (status) {
      case 'APPROVED':
        notificationTitle = '캠페인 지원 승인'
        notificationMessage = `축하합니다! "${campaign.title}" 캠페인 지원이 승인되었습니다.`
        break
      case 'REJECTED':
        notificationTitle = '캠페인 지원 거절'
        notificationMessage = `"${campaign.title}" 캠페인 지원이 거절되었습니다.`
        break
      case 'CANCELLED':
        notificationTitle = '캠페인 지원 취소'
        notificationMessage = `"${campaign.title}" 캠페인 지원이 취소되었습니다.`
        break
      default:
        notificationTitle = '캠페인 지원 상태 변경'
        notificationMessage = `"${campaign.title}" 캠페인 지원 상태가 변경되었습니다.`
    }

    // 인플루언서에게 알림 전송
    await prisma.notification.create({
      data: {
        userId: application.influencerId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: notificationTitle,
        message: notificationMessage,
        actionUrl: `/dashboard`,
        metadata: JSON.stringify({
          campaignId,
          applicationId: applicantId,
          status,
          campaignTitle: campaign.title
        })
      }
    })

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: `지원 상태가 ${status}로 변경되었습니다.`
    })

  } catch (error) {
    console.error('Update applicant status error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}