import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdminAuth } from '@/lib/admin-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== Status Update API Called ===')
    console.log('Campaign ID:', params.id)
    
    // 관리자 인증 확인
    const authResult = await requireAdminAuth(request)
    if (authResult.error) {
      console.log('Auth failed:', authResult.error)
      return authResult.error
    }
    const { user } = authResult
    console.log('Admin user:', { id: user.id, email: user.email, type: user.type })

    const body = await request.json()
    console.log('Request body:', body)
    
    const { status } = body
    const campaignId = params.id

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // 상태값 변환 (소문자로 오는 경우 대문자로 변환)
    const dbStatus = status.toUpperCase()
    console.log('Status conversion:', { original: status, converted: dbStatus })

    // 먼저 캠페인이 존재하는지 확인
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true, title: true }
    })
    
    if (!existingCampaign) {
      console.log('Campaign not found:', campaignId)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    console.log('Existing campaign:', existingCampaign)

    // 캠페인 상태 업데이트
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { 
        status: dbStatus,
        updatedAt: new Date()
      }
    })
    
    console.log('Campaign updated successfully:', { id: updatedCampaign.id, newStatus: updatedCampaign.status })

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign
    })

  } catch (error) {
    console.error('=== Campaign Status Update Error ===')
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