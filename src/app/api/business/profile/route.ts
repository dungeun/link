import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { verifyJWT } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/business/profile - 비즈니스 프로필 조회
export async function GET(request: NextRequest) {
  try {
    // 토큰 검증
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user;
    try {
      user = await verifyJWT(token);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!user || user.type !== 'BUSINESS') {
      return NextResponse.json({ error: 'Not a business account' }, { status: 403 })
    }

    // 비즈니스 정보 조회
    const businessUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        businessProfile: true
      }
    })

    if (!businessUser || !businessUser.businessProfile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    // 응답 데이터 포맷
    const profileData = {
      id: businessUser.id,
      email: businessUser.email,
      name: businessUser.name,
      type: businessUser.type,
      status: businessUser.status,
      businessProfile: {
        id: businessUser.businessProfile.id,
        companyName: businessUser.businessProfile.companyName,
        businessNumber: businessUser.businessProfile.businessNumber,
        representativeName: businessUser.businessProfile.representativeName,
        businessAddress: businessUser.businessProfile.businessAddress,
        businessCategory: businessUser.businessProfile.businessCategory,
        websiteUrl: businessUser.businessProfile.websiteUrl,
        description: businessUser.businessProfile.description,
        profileImage: businessUser.businessProfile.profileImage,
        isVerified: businessUser.businessProfile.isVerified,
        verifiedAt: businessUser.businessProfile.verifiedAt,
        createdAt: businessUser.businessProfile.createdAt,
        updatedAt: businessUser.businessProfile.updatedAt
      }
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error('Business profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business profile' },
      { status: 500 }
    )
  }
}

// PUT /api/business/profile - 비즈니스 프로필 업데이트
export async function PUT(request: NextRequest) {
  try {
    // 토큰 검증
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user;
    try {
      user = await verifyJWT(token);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!user || user.type !== 'BUSINESS') {
      return NextResponse.json({ error: 'Not a business account' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      companyName,
      businessNumber,
      representativeName,
      businessAddress,
      businessCategory,
      websiteUrl,
      description,
      profileImage
    } = body

    // 사용자 이름 업데이트
    if (name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name }
      })
    }

    // 비즈니스 프로필 업데이트
    const updatedProfile = await prisma.businessProfile.update({
      where: { userId: user.id },
      data: {
        ...(companyName && { companyName }),
        ...(businessNumber && { businessNumber }),
        ...(representativeName && { representativeName }),
        ...(businessAddress && { businessAddress }),
        ...(businessCategory && { businessCategory }),
        ...(websiteUrl && { websiteUrl }),
        ...(description && { description }),
        ...(profileImage && { profileImage })
      },
      include: {
        user: true
      }
    })

    // 응답 데이터 포맷
    const profileData = {
      id: updatedProfile.user.id,
      email: updatedProfile.user.email,
      name: updatedProfile.user.name,
      type: updatedProfile.user.type,
      status: updatedProfile.user.status,
      businessProfile: {
        id: updatedProfile.id,
        companyName: updatedProfile.companyName,
        businessNumber: updatedProfile.businessNumber,
        representativeName: updatedProfile.representativeName,
        businessAddress: updatedProfile.businessAddress,
        businessCategory: updatedProfile.businessCategory,
        websiteUrl: updatedProfile.websiteUrl,
        description: updatedProfile.description,
        profileImage: updatedProfile.profileImage,
        isVerified: updatedProfile.isVerified,
        verifiedAt: updatedProfile.verifiedAt,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt
      }
    }

    return NextResponse.json({
      success: true,
      profile: profileData
    })
  } catch (error) {
    console.error('Business profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    )
  }
}