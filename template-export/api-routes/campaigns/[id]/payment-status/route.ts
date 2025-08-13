import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 인증 미들웨어
async function authenticate(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }
  const authHeader = request.headers.get('authorization')
  let token = null
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  if (!token) {
    const cookieStore = cookies()
    token = cookieStore.get('auth-token')?.value
  }

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch (error) {
    return null
  }
}

// PUT /api/admin/campaigns/[id]/payment-status - 결제 상태 변경
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }
    
    // 관리자만 접근 가능
    const userType = user.type?.toLowerCase()
    if (userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isPaid } = body

    if (typeof isPaid !== 'boolean') {
      return NextResponse.json(
        { error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }

    // 캠페인 업데이트
    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: { 
        isPaid,
        // 결제 완료시 ACTIVE로 변경, 미결제시 상태 유지
        ...(isPaid && { status: 'ACTIVE' })
      }
    })

    // 결제 상태 변경시 Payment 레코드도 업데이트
    if (isPaid) {
      // 관련 Payment가 있다면 COMPLETED로 변경
      await prisma.payment.updateMany({
        where: { 
          campaignId: params.id,
          status: { not: 'COMPLETED' }
        },
        data: {
          status: 'COMPLETED',
          approvedAt: new Date(),
          metadata: JSON.stringify({
            adminManualUpdate: true,
            updatedBy: user.email,
            updatedAt: new Date().toISOString()
          })
        }
      })
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        isPaid: campaign.isPaid,
        status: campaign.status
      }
    })

  } catch (error) {
    console.error('결제 상태 변경 오류:', error)
    return NextResponse.json(
      { error: '결제 상태 변경에 실패했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}