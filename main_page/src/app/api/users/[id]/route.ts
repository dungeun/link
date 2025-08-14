import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import bcrypt from 'bcryptjs';
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

// GET /api/users/[id] - 사용자 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const currentUser = await authenticate(request);

    // Mock 사용자 데이터
    const mockUser = {
      id: userId,
      name: '김인플루언서',
      email: 'influencer@example.com',
      type: 'influencer',
      profile: {
        bio: '뷰티와 라이프스타일을 사랑하는 인플루언서입니다.',
        categories: ['beauty', 'lifestyle', 'fashion'],
        location: '서울특별시',
        languages: ['한국어', '영어'],
        social_media: {
          instagram: 'beauty_influencer',
          youtube: 'BeautyChannel',
          blog: 'blog.naver.com/beauty'
        },
        followers_count: 52000,
        engagement_rate: 4.8,
        completed_campaigns: 23,
        rating: 4.7
      },
      created_at: new Date().toISOString()
    };

    // 개인정보 필터링 (본인이 아닌 경우)
    if (!currentUser || currentUser.id !== userId) {
      const { email, ...userWithoutEmail } = mockUser;
      return NextResponse.json(userWithoutEmail);
    }

    return NextResponse.json(mockUser);
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    return NextResponse.json(
      { error: '사용자 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - 사용자 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    const userId = params.id;

    // 본인 확인
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      bio,
      categories,
      location,
      languages,
      social_media,
      notifications,
      privacy
    } = body;

    // 이메일 중복 확인
    if (email && email !== user.email) {
      // const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      // if (existing.length > 0) {
      //   return NextResponse.json({ error: '이미 사용중인 이메일입니다.' }, { status: 400 });
      // }
    }

    // Mock 응답
    const updatedUser = {
      id: userId,
      name: name || user.name,
      email: email || user.email,
      phone,
      profile: {
        bio,
        categories,
        location,
        languages,
        social_media,
        updated_at: new Date().toISOString()
      },
      settings: {
        notifications,
        privacy
      }
    };

    return NextResponse.json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: updatedUser
    });
  } catch (error) {
    console.error('사용자 정보 수정 오류:', error);
    return NextResponse.json(
      { error: '프로필 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - 회원 탈퇴
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request);
    const userId = params.id;

    // 본인 확인
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 트랜잭션으로 사용자 삭제
    await withTransaction(async (client) => {
      // 관련 데이터 삭제
      // await client.query('DELETE FROM campaign_applications WHERE user_id = $1', [userId]);
      // await client.query('DELETE FROM campaigns WHERE user_id = $1', [userId]);
      // await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    // 쿠키 삭제
    const cookieStore = cookies();
    cookieStore.delete('auth-token');
    cookieStore.delete('refresh-token');

    return NextResponse.json({
      message: '회원 탈퇴가 완료되었습니다.'
    });
  } catch (error) {
    console.error('회원 탈퇴 오류:', error);
    return NextResponse.json(
      { error: '회원 탈퇴에 실패했습니다.' },
      { status: 500 }
    );
  }
}