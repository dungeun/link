import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

// GET: 사용자의 소셜 계정 연동 상태 조회
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 사용자의 모든 소셜 계정 조회
    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        provider: true,
        profileImage: true,
        profileData: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true
      }
    });

    // 각 제공자별 연동 상태 정리
    const accountStatus = {
      google: socialAccounts.find(acc => acc.provider === 'google') || null,
      kakao: socialAccounts.find(acc => acc.provider === 'kakao') || null,
      naver: socialAccounts.find(acc => acc.provider === 'naver') || null
    };

    return NextResponse.json({
      success: true,
      accounts: accountStatus,
      connectedProviders: socialAccounts.map(acc => acc.provider)
    });

  } catch (error) {
    console.error('Failed to get social accounts:', error);
    return NextResponse.json(
      { error: 'Failed to get social accounts' },
      { status: 500 }
    );
  }
}

// POST: 소셜 계정 연동 정보 저장 (로그인 시 호출)
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      provider,
      providerUserId,
      accessToken,
      refreshToken,
      profileImage,
      profileData,
      expiresAt
    } = await req.json();

    if (!provider || !providerUserId) {
      return NextResponse.json(
        { error: 'Provider and providerUserId are required' },
        { status: 400 }
      );
    }

    // 소셜 계정 정보 저장/업데이트
    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: provider
        }
      },
      create: {
        userId: user.id,
        provider,
        providerUserId,
        accessToken,
        refreshToken,
        profileImage,
        profileData,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      update: {
        providerUserId,
        accessToken,
        refreshToken,
        profileImage,
        profileData,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      account: {
        id: socialAccount.id,
        provider: socialAccount.provider,
        profileImage: socialAccount.profileImage,
        createdAt: socialAccount.createdAt,
        updatedAt: socialAccount.updatedAt
      }
    });

  } catch (error) {
    console.error('Failed to save social account:', error);
    return NextResponse.json(
      { error: 'Failed to save social account' },
      { status: 500 }
    );
  }
}

// DELETE: 소셜 계정 연동 해제
export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    // 소셜 계정 연동 해제
    const deletedAccount = await prisma.socialAccount.delete({
      where: {
        userId_provider: {
          userId: user.id,
          provider: provider
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${provider} 계정 연동이 해제되었습니다.`,
      deletedProvider: deletedAccount.provider
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '연동되지 않은 계정입니다.' },
        { status: 404 }
      );
    }
    
    console.error('Failed to disconnect social account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect social account' },
      { status: 500 }
    );
  }
}