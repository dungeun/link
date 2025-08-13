import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyJWT } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/influencer/profile - 프로필 조회
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      type: profile.type,
      profile: profile.profile ? {
        bio: profile.profile.bio,
        profileImage: profile.profile.profileImage,
        phone: profile.profile.phone,
        realName: profile.profile.realName,
        birthDate: profile.profile.birthDate,
        birthYear: profile.profile.birthYear,
        gender: profile.profile.gender,
        nationality: profile.profile.nationality,
        address: profile.profile.address,
        addressData: profile.profile.addressData,
        instagram: profile.profile.instagram,
        instagramFollowers: profile.profile.instagramFollowers,
        youtube: profile.profile.youtube,
        youtubeSubscribers: profile.profile.youtubeSubscribers,
        tiktok: profile.profile.tiktok,
        tiktokFollowers: profile.profile.tiktokFollowers,
        naverBlog: profile.profile.naverBlog,
        followerCount: profile.profile.followerCount,
        categories: profile.profile.categories,
        averageEngagementRate: profile.profile.averageEngagementRate,
        bankName: profile.profile.bankName,
        bankAccountNumber: profile.profile.bankAccountNumber,
        bankAccountHolder: profile.profile.bankAccountHolder
      } : null
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/influencer/profile - 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      email,
      bio,
      phone,
      realName,
      birthDate,
      birthYear,
      gender,
      nationality,
      address,
      addressData,
      profileImage,
      instagram,
      youtube,
      tiktok,
      facebook,
      twitter,
      naverBlog,
      categories,
      bankName,
      bankAccountNumber,
      bankAccountHolder
    } = data;

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        profile: {
          upsert: {
            create: {
              bio,
              phone,
              realName,
              birthDate: birthDate ? new Date(birthDate) : undefined,
              birthYear,
              gender,
              nationality,
              address,
              addressData,
              profileImage,
              instagram,
              youtube,
              tiktok,
              facebook,
              twitter,
              naverBlog,
              categories: categories ? JSON.stringify(categories) : undefined,
              bankName,
              bankAccountNumber,
              bankAccountHolder
            },
            update: {
              bio,
              phone,
              realName,
              birthDate: birthDate ? new Date(birthDate) : undefined,
              birthYear,
              gender,
              nationality,
              address,
              addressData,
              profileImage,
              instagram,
              youtube,
              tiktok,
              facebook,
              twitter,
              naverBlog,
              categories: categories ? JSON.stringify(categories) : undefined,
              bankName,
              bankAccountNumber,
              bankAccountHolder
            }
          }
        }
      },
      include: {
        profile: true
      }
    });

    return NextResponse.json({
      message: '프로필이 업데이트되었습니다.',
      profile: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        type: updatedUser.type,
        profile: updatedUser.profile
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/influencer/profile/sns - SNS 정보 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      instagram,
      instagramFollowers,
      youtube,
      youtubeSubscribers,
      tiktok,
      tiktokFollowers,
      naverBlog
    } = data;

    // 총 팔로워 수 계산
    const totalFollowers = (instagramFollowers || 0) + 
                          (youtubeSubscribers || 0) + 
                          (tiktokFollowers || 0);

    // SNS 정보 업데이트
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        instagram,
        instagramFollowers,
        youtube,
        youtubeSubscribers,
        tiktok,
        tiktokFollowers,
        naverBlog,
        followerCount: totalFollowers
      },
      update: {
        instagram,
        instagramFollowers,
        youtube,
        youtubeSubscribers,
        tiktok,
        tiktokFollowers,
        naverBlog,
        followerCount: totalFollowers
      }
    });

    return NextResponse.json({
      message: 'SNS 정보가 업데이트되었습니다.',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating SNS info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}