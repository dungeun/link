import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/business/campaign-templates - 템플릿 목록 조회
export async function GET(request: NextRequest) {
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

    // 해당 비즈니스의 템플릿 목록 조회
    const templates = await prisma.campaignTemplate.findMany({
      where: {
        businessId: userId
      },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      templates
    })

  } catch (error) {
    console.error('Failed to fetch campaign templates:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/business/campaign-templates - 템플릿 생성
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, description, data, isDefault } = body

    // 필수 필드 검증
    if (!name || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 기본 템플릿으로 설정하는 경우, 기존 기본 템플릿 해제
    if (isDefault) {
      await prisma.campaignTemplate.updateMany({
        where: {
          businessId: userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // 템플릿 생성
    const template = await prisma.campaignTemplate.create({
      data: {
        businessId: userId,
        name,
        description,
        data,
        isDefault: isDefault || false
      }
    })

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('Failed to create campaign template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/business/campaign-templates - 템플릿 수정
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { id, name, description, data, isDefault } = body

    // 필수 필드 검증
    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // 템플릿 소유권 확인
    const existingTemplate = await prisma.campaignTemplate.findUnique({
      where: { id },
      select: { businessId: true }
    })

    if (!existingTemplate || existingTemplate.businessId !== userId) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      )
    }

    // 기본 템플릿으로 설정하는 경우, 기존 기본 템플릿 해제
    if (isDefault) {
      await prisma.campaignTemplate.updateMany({
        where: {
          businessId: userId,
          isDefault: true,
          id: { not: id }
        },
        data: {
          isDefault: false
        }
      })
    }

    // 템플릿 업데이트
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (data !== undefined) updateData.data = data
    if (isDefault !== undefined) updateData.isDefault = isDefault

    const template = await prisma.campaignTemplate.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('Failed to update campaign template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/business/campaign-templates - 템플릿 삭제
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // 템플릿 소유권 확인
    const existingTemplate = await prisma.campaignTemplate.findUnique({
      where: { id },
      select: { businessId: true }
    })

    if (!existingTemplate || existingTemplate.businessId !== userId) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      )
    }

    // 템플릿 삭제
    await prisma.campaignTemplate.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Failed to delete campaign template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}