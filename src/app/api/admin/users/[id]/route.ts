import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// API 라우트를 동적으로 설정 (정적 생성 방지)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 인증 미들웨어
async function authenticate(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/admin/users/[id] - 특정 사용자 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자만 접근 가능
    const userType = user.type?.toLowerCase();
    if (userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 사용자 상세 정보 조회
    const userDetail = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        profile: true,
        businessProfile: true,
        campaigns: {
          select: {
            id: true
          }
        },
        applications: {
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!userDetail) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 응답 데이터 포맷팅
    const formattedUser = {
      id: userDetail.id,
      name: userDetail.name,
      email: userDetail.email,
      type: userDetail.type.toLowerCase(),
      status: userDetail.status?.toLowerCase() || 'active',
      createdAt: userDetail.createdAt.toISOString().split('T')[0],
      lastLogin: userDetail.lastLogin ? userDetail.lastLogin.toISOString().split('T')[0] : '미접속',
      verified: userDetail.verified || false,
      campaigns: userDetail.type === 'BUSINESS' ? userDetail.campaigns?.length || 0 : userDetail.applications?.length || 0,
      applications: userDetail.type === 'INFLUENCER' ? userDetail.applications?.length || 0 : undefined,
      phone: userDetail.profile?.phone || '미등록',
      address: userDetail.type === 'BUSINESS' ? userDetail.businessProfile?.businessAddress : 
        (userDetail.profile as any)?.address || '미등록',
      profile: userDetail.profile ? {
        bio: userDetail.profile.bio,
        instagram: userDetail.profile.instagram,
        instagramFollowers: userDetail.profile.instagramFollowers,
        youtube: userDetail.profile.youtube,
        youtubeSubscribers: userDetail.profile.youtubeSubscribers,
        tiktok: userDetail.profile.tiktok,
        tiktokFollowers: userDetail.profile.tiktokFollowers,
        followerCount: userDetail.profile.followerCount,
        categories: userDetail.profile.categories,
        phone: userDetail.profile.phone
      } : undefined,
      businessProfile: userDetail.businessProfile ? {
        companyName: userDetail.businessProfile.companyName,
        businessNumber: userDetail.businessProfile.businessNumber,
        representativeName: userDetail.businessProfile.representativeName,
        businessAddress: userDetail.businessProfile.businessAddress,
        businessCategory: userDetail.businessProfile.businessCategory
      } : undefined
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('사용자 상세 조회 오류:', error);
    return NextResponse.json(
      { error: '사용자 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/admin/users/[id] - 사용자 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자만 접근 가능
    const userType = user.type?.toLowerCase();
    if (userType !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, status, type, phone, verified, statusReason } = body;

    // 사용자 기본 정보 업데이트
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (status !== undefined) {
      updateData.status = status.toUpperCase();
      updateData.statusUpdatedAt = new Date();
    }
    
    if (type !== undefined) {
      updateData.type = type.toUpperCase();
    }
    
    if (verified !== undefined) {
      updateData.verified = verified;
    }
    
    if (statusReason !== undefined) {
      updateData.statusReason = statusReason;
    }

    // 트랜잭션으로 사용자와 프로필 업데이트
    const updatedUser = await prisma.$transaction(async (prisma) => {
      // 사용자 기본 정보 업데이트
      const user = await prisma.user.update({
        where: { id: params.id },
        data: updateData,
        include: {
          profile: true,
          businessProfile: true
        }
      });

      // 전화번호가 포함된 경우 프로필 업데이트
      if (phone !== undefined) {
        // 프로필이 없으면 생성
        await prisma.profile.upsert({
          where: { userId: params.id },
          update: { phone },
          create: {
            userId: params.id,
            phone
          }
        });
      }

      // 업데이트된 정보 다시 조회
      return await prisma.user.findUnique({
        where: { id: params.id },
        include: {
          profile: true,
          businessProfile: true
        }
      });
    });

    return NextResponse.json({
      message: '사용자 정보가 업데이트되었습니다.',
      user: updatedUser
    });
  } catch (error) {
    console.error('사용자 업데이트 오류:', error);
    return NextResponse.json(
      { error: '사용자 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}