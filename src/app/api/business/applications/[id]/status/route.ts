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
  let token = cookieStore.get('auth-token')?.value;

  // 쿠키에서 토큰이 없으면 Authorization 헤더에서 확인
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string; type?: string; email?: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// POST /api/business/applications/[id]/status - 지원서 상태 변경
export async function POST(
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
    
    const userType = user.type?.toLowerCase();
    if (userType !== 'business' && userType !== 'admin') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '올바른 상태를 입력해주세요. (approved 또는 rejected)' },
        { status: 400 }
      );
    }

    // 지원서 존재 여부 확인
    const application = await prisma.campaignApplication.findUnique({
      where: { id: params.id },
      include: {
        campaign: {
          select: {
            businessId: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: '지원서를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (해당 캠페인의 소유자인지)
    if (application.campaign.businessId !== (user.userId || user.id) && userType !== 'admin') {
      return NextResponse.json(
        { error: '해당 지원서를 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 상태 업데이트
    const updatedApplication = await prisma.campaignApplication.update({
      where: { id: params.id },
      data: {
        status: status.toUpperCase()
      }
    });

    return NextResponse.json({
      message: `지원서가 ${status === 'approved' ? '승인' : '거절'}되었습니다.`,
      application: updatedApplication
    });
  } catch (error) {
    console.error('지원서 상태 변경 오류:', error);
    return NextResponse.json(
      { error: '지원서 상태 변경에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}