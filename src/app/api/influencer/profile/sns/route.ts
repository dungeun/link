import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyJWT } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PATCH /api/influencer/profile/sns - SNS 계정 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    const { 
      instagram, 
      instagramFollowers,
      youtube, 
      youtubeSubscribers,
      naverBlog, 
      tiktok,
      tiktokFollowers,
      facebook,
      facebookFollowers,
      twitter,
      twitterFollowers
    } = await request.json();

    // 프로필이 있는지 확인
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id }
    });

    if (existingProfile) {
      // 업데이트
      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          instagram,
          instagramFollowers,
          youtube,
          youtubeSubscribers,
          naverBlog,
          tiktok,
          tiktokFollowers,
          facebook,
          facebookFollowers,
          twitter,
          twitterFollowers
        }
      });
    } else {
      // 새로 생성
      await prisma.profile.create({
        data: {
          userId: user.id,
          instagram,
          instagramFollowers,
          youtube,
          youtubeSubscribers,
          naverBlog,
          tiktok,
          tiktokFollowers,
          facebook,
          facebookFollowers,
          twitter,
          twitterFollowers
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SNS 업데이트 오류:', error);
    return NextResponse.json(
      { error: 'SNS 계정 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}