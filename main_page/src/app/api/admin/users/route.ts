import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 인증 미들웨어
async function authenticate(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }
  
  // Authorization 헤더 확인
  let token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // 쿠키 확인
  if (!token) {
    const cookieStore = cookies();
    token = cookieStore.get('auth-token')?.value || null;
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET /api/admin/users - 모든 사용자 조회
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자만 접근 가능
    const userType = user.type?.toUpperCase();
    console.log('User authentication:', { userId: user.id, userType });
    if (userType !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    // URL 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 쿼리 조건 구성
    const where: any = {};
    
    if (type && type !== 'all') {
      where.type = type.toUpperCase();
    }
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 전체 사용자 수 계산 (페이지네이션용)
    const totalCount = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // 사용자 조회 (페이지네이션 적용)
    const users = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        businessProfile: true,
        campaigns: {
          select: {
            id: true
          }
        },
        // campaignApplications 필드가 존재하지 않음 - 주석 처리
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // 응답 데이터 포맷팅
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type.toLowerCase(),
      status: user.status?.toLowerCase() || 'active',
      createdAt: user.createdAt.toISOString().split('T')[0],
      lastLogin: user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : '미접속',
      verified: (user as any).emailVerified,
      campaigns: user.type === 'BUSINESS' ? user.campaigns.length : 0,
      followers: user.type === 'INFLUENCER' ? user.profile?.followerCount || 0 : undefined,
      phone: user.profile?.phone || user.businessProfile?.businessAddress ? 
        user.profile?.phone || '미등록' : undefined,
      address: user.type === 'BUSINESS' ? user.businessProfile?.businessAddress : 
        (user.profile as any)?.address || '미등록'
    }));

    // 전체 통계 가져오기 (필터와 관계없이)
    const totalStats = await prisma.user.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    });

    const stats = {
      total: await prisma.user.count(),
      admin: totalStats.find(s => s.type === 'ADMIN')?._count.type || 0,
      influencer: totalStats.find(s => s.type === 'INFLUENCER')?._count.type || 0,
      business: totalStats.find(s => s.type === 'BUSINESS')?._count.type || 0
    };

    return NextResponse.json({
      users: formattedUsers,
      total: totalCount,
      totalPages,
      currentPage: page,
      stats
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '사용자 목록을 불러오는데 실패했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - 사용자 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자만 접근 가능
    const userType = user.type?.toUpperCase();
    if (userType !== 'ADMIN') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, status, verified } = body;

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 업데이트할 데이터
    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status.toUpperCase();
    }
    
    if (verified !== undefined) {
      updateData.verified = verified;
    }

    // 사용자 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({
      message: '사용자 정보가 업데이트되었습니다.',
      user: {
        id: updatedUser.id,
        status: updatedUser.status?.toLowerCase(),
        verified: updatedUser.verified
      }
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