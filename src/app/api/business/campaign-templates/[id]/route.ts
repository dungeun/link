import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/business/campaign-templates/[id] - 특정 템플릿 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('accessToken')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    let userType: string
    
    try {
      const payload = await verifyJWT(token)
      userId = payload.id
      userType = payload.type
      
      // 비즈니스 계정만 접근 가능
      if (userType !== 'BUSINESS' && userType !== 'ADMIN') {
        return NextResponse.json({ error: 'Business access required' }, { status: 403 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const templateId = params.id

    // 템플릿 조회
    const template = await prisma.campaignTemplate.findUnique({
      where: { id: templateId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // 소유권 확인
    if (template.businessId !== userId && userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('Failed to fetch campaign template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
