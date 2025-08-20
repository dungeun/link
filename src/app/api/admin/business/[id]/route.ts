import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAdminAuth } from '@/lib/auth-utils'

// PUT /api/admin/business/[id] - 업체 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 인증 확인
    const authResult = await verifyAdminAuth(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      )
    }

    const businessId = params.id
    const body = await request.json()

    // 업체(BUSINESS 타입 사용자) 존재 확인
    const existingBusiness = await prisma.user.findUnique({
      where: { 
        id: businessId,
        type: 'BUSINESS'
      },
      include: { businessProfile: true }
    })

    if (!existingBusiness) {
      return NextResponse.json(
        { error: '업체를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 업체 프로필 업데이트 또는 생성
    if (body.businessProfile) {
      if (existingBusiness.businessProfile) {
        // 프로필이 이미 존재하면 업데이트
        await prisma.businessProfile.update({
          where: { userId: businessId },
          data: {
            companyName: body.businessProfile.companyName,
            businessNumber: body.businessProfile.businessNumber,
            representativeName: body.businessProfile.representativeName,
            businessCategory: body.businessProfile.businessCategory,
            businessAddress: body.businessProfile.businessAddress,
            updatedAt: new Date()
          }
        })
      } else {
        // 프로필이 없으면 생성
        await prisma.businessProfile.create({
          data: {
            userId: businessId,
            companyName: body.businessProfile.companyName,
            businessNumber: body.businessProfile.businessNumber,
            representativeName: body.businessProfile.representativeName,
            businessCategory: body.businessProfile.businessCategory,
            businessAddress: body.businessProfile.businessAddress
          }
        })
      }
    }

    // 업체 기본 정보 업데이트 (필요한 경우)
    if (body.name) {
      await prisma.user.update({
        where: { id: businessId },
        data: {
          name: body.name,
          updatedAt: new Date()
        }
      })
    }

    // 업데이트된 업체 정보 반환
    const updatedBusiness = await prisma.user.findUnique({
      where: { id: businessId },
      include: {
        businessProfile: true,
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: '업체 정보가 성공적으로 수정되었습니다.',
      business: updatedBusiness
    })
  } catch (error) {
    console.error('업체 정보 수정 오류:', error)
    return NextResponse.json(
      { error: '업체 정보 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET /api/admin/business/[id] - 업체 상세 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 관리자 인증 확인
    const authResult = await verifyAdminAuth(request)
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      )
    }

    const businessId = params.id

    const business = await prisma.user.findUnique({
      where: { 
        id: businessId,
        type: 'BUSINESS'
      },
      include: {
        businessProfile: true,
        campaigns: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            budget: true,
            _count: {
              select: {
                applications: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            campaigns: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: '업체를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      business
    })
  } catch (error) {
    console.error('업체 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '업체 정보 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}