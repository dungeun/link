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

    let user;
    try {
      user = await verifyJWT(token);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json({ error: 'Not an influencer account' }, { status: 403 });
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

    // 안전한 응답 데이터 구성
    const responseData = {
      id: profile.id,
      name: profile.name || '',
      email: profile.email || '',
      type: profile.type,
      profileCompleted: profile.profile?.profileCompleted || false,
      profile: profile.profile ? {
        bio: profile.profile.bio || null,
        profileImage: profile.profile.profileImage || null,
        phone: profile.profile.phone || null,
        realName: profile.profile.realName || null,
        birthDate: profile.profile.birthDate || null,
        birthYear: profile.profile.birthYear || null,
        gender: profile.profile.gender || null,
        nationality: profile.profile.nationality || null,
        address: profile.profile.address || null,
        addressData: profile.profile.addressData || null,
        instagram: profile.profile.instagram || null,
        instagramFollowers: profile.profile.instagramFollowers || 0,
        youtube: profile.profile.youtube || null,
        youtubeSubscribers: profile.profile.youtubeSubscribers || 0,
        tiktok: profile.profile.tiktok || null,
        tiktokFollowers: profile.profile.tiktokFollowers || 0,
        naverBlog: profile.profile.naverBlog || null,
        followerCount: profile.profile.followerCount || 0,
        categories: profile.profile.categories || null,
        averageEngagementRate: profile.profile.averageEngagementRate || 0,
        bankName: profile.profile.bankName || null,
        bankAccountNumber: profile.profile.bankAccountNumber || null,
        bankAccountHolder: profile.profile.bankAccountHolder || null,
        profileCompleted: profile.profile.profileCompleted || false
      } : null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/influencer/profile - 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user;
    try {
      user = await verifyJWT(token);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!user || user.type !== 'INFLUENCER') {
      return NextResponse.json({ error: 'Not an influencer account' }, { status: 403 });
    }

    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
    }

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

    // 생년월일 안전 처리
    let parsedBirthDate = undefined;
    if (birthDate) {
      try {
        const date = new Date(birthDate);
        if (!isNaN(date.getTime())) {
          parsedBirthDate = date;
        }
      } catch (e) {
        console.warn('Invalid birthDate format:', birthDate);
      }
    }

    // 카테고리 안전 처리
    let categoriesString = undefined;
    if (categories) {
      try {
        if (Array.isArray(categories)) {
          categoriesString = JSON.stringify(categories);
        } else if (typeof categories === 'string') {
          categoriesString = categories;
        }
      } catch (e) {
        console.warn('Failed to process categories:', e);
      }
    }

    // addressData 안전 처리
    let processedAddressData = undefined;
    if (addressData) {
      try {
        if (typeof addressData === 'object') {
          processedAddressData = addressData;
        } else if (typeof addressData === 'string') {
          processedAddressData = JSON.parse(addressData);
        }
      } catch (e) {
        console.warn('Failed to process addressData:', e);
      }
    }

    // 프로필 완성 상태 체크
    const checkProfileCompleted = (profileData: { 
      realName?: string; 
      birthYear?: number; 
      gender?: string; 
      phone?: string; 
      address?: string; 
    }) => {
      const requiredFields = [
        profileData.realName || realName,
        profileData.birthYear || birthYear,
        profileData.gender || gender,
        profileData.phone || phone,
        profileData.address || address
      ];
      return requiredFields.every(field => field !== null && field !== undefined && field !== '');
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        profile: {
          upsert: {
            create: {
              bio: bio || null,
              phone: phone || null,
              realName: realName || null,
              birthDate: parsedBirthDate,
              birthYear: birthYear || null,
              gender: gender || null,
              nationality: nationality || null,
              address: address || null,
              addressData: processedAddressData,
              profileImage: profileImage || null,
              instagram: instagram || null,
              youtube: youtube || null,
              tiktok: tiktok || null,
              facebook: facebook || null,
              twitter: twitter || null,
              naverBlog: naverBlog || null,
              categories: categoriesString,
              bankName: bankName || null,
              bankAccountNumber: bankAccountNumber || null,
              bankAccountHolder: bankAccountHolder || null,
              profileCompleted: checkProfileCompleted({
                realName, birthYear, gender, phone, address
              })
            },
            update: {
              bio: bio || null,
              phone: phone || null,
              realName: realName || null,
              birthDate: parsedBirthDate,
              birthYear: birthYear || null,
              gender: gender || null,
              nationality: nationality || null,
              address: address || null,
              addressData: processedAddressData,
              profileImage: profileImage || null,
              instagram: instagram || null,
              youtube: youtube || null,
              tiktok: tiktok || null,
              facebook: facebook || null,
              twitter: twitter || null,
              naverBlog: naverBlog || null,
              categories: categoriesString,
              bankName: bankName || null,
              bankAccountNumber: bankAccountNumber || null,
              bankAccountHolder: bankAccountHolder || null,
              profileCompleted: checkProfileCompleted({
                realName, birthYear, gender, phone, address
              })
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
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        type: updatedUser.type,
        profile: updatedUser.profile
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // 구체적인 오류 메시지 제공
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Duplicate data error',
          message: '중복된 데이터가 있습니다.'
        }, { status: 409 });
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({ 
          error: 'Data reference error',
          message: '데이터 참조 오류가 발생했습니다.'
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: '프로필 업데이트 중 오류가 발생했습니다.'
    }, { status: 500 });
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