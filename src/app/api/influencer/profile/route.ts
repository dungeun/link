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
    const contentType = request.headers.get('content-type');
    
    try {
      if (contentType?.includes('multipart/form-data')) {
        // FormData 요청 처리
        const formData = await request.formData();
        const profileString = formData.get('profile') as string;
        
        if (profileString) {
          data = JSON.parse(profileString);
        } else {
          // FormData에서 직접 필드 추출
          data = {
            name: formData.get('name'),
            email: formData.get('email'),
            bio: formData.get('bio'),
            phone: formData.get('phone'),
            realName: formData.get('realName'),
            birthDate: formData.get('birthDate'),
            birthYear: formData.get('birthYear'),
            gender: formData.get('gender'),
            nationality: formData.get('nationality'),
            address: formData.get('address'),
            addressData: formData.get('addressData') ? JSON.parse(formData.get('addressData') as string) : null,
            profileImage: formData.get('profileImage')
          };
        }
        
        // 프로필 이미지 파일 처리 (향후 확장용)
        const profileImageFile = formData.get('profileImage') as File;
        if (profileImageFile && profileImageFile.size > 0) {
          // 파일 업로드 로직 추가 가능
        }
      } else {
        // JSON 요청 처리
        data = await request.json();
      }
    } catch (parseError) {
      console.error('Data parse error:', parseError);
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
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
      bankAccountHolder,
      bankingInfo
    } = data;

    // bankingInfo 객체가 있으면 개별 필드로 추출
    let extractedBankName = bankName;
    let extractedBankAccountNumber = bankAccountNumber;
    let extractedBankAccountHolder = bankAccountHolder;

    if (bankingInfo) {
      if (bankingInfo.accountType === 'domestic') {
        extractedBankName = bankingInfo.domestic?.bankName || bankName;
        extractedBankAccountNumber = bankingInfo.domestic?.accountNumber || bankAccountNumber;
        extractedBankAccountHolder = bankingInfo.domestic?.accountHolder || bankAccountHolder;
      } else if (bankingInfo.accountType === 'international') {
        extractedBankName = bankingInfo.international?.bankEnglishName || bankName;
        extractedBankAccountNumber = bankingInfo.international?.accountNumber || bankAccountNumber;
        extractedBankAccountHolder = bankingInfo.international?.englishName || bankAccountHolder;
      }
    }

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
    let processedAddressData = null;
    if (addressData) {
      try {
        if (typeof addressData === 'object') {
          // Prisma JSON 필드로 직접 저장
          processedAddressData = addressData;
        } else if (typeof addressData === 'string') {
          processedAddressData = JSON.parse(addressData);
        }
      } catch (e) {
        console.warn('Failed to process addressData:', e);
        processedAddressData = null;
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
      const currentRealName = profileData.realName || realName;
      const currentBirthYear = profileData.birthYear || birthYear;
      const currentGender = profileData.gender || gender;
      const currentPhone = profileData.phone || phone;
      const currentAddress = profileData.address || address;
      
      // 필수 필드들 검증 (더 유연한 조건)
      const isRealNameValid = currentRealName && String(currentRealName).trim() !== '';
      const isBirthYearValid = currentBirthYear && Number(currentBirthYear) > 1900 && Number(currentBirthYear) <= new Date().getFullYear();
      const isGenderValid = currentGender && ['male', 'female', 'other'].includes(String(currentGender));
      const isPhoneValid = currentPhone && String(currentPhone).trim() !== '';
      const isAddressValid = currentAddress && String(currentAddress).trim() !== '';
      
      console.log('Profile completion check:', {
        realName: isRealNameValid,
        birthYear: isBirthYearValid,
        gender: isGenderValid,
        phone: isPhoneValid,
        address: isAddressValid,
        values: {
          realName: currentRealName,
          birthYear: currentBirthYear,
          gender: currentGender,
          phone: currentPhone,
          address: currentAddress
        }
      });
      
      return isRealNameValid && isBirthYearValid && isGenderValid && isPhoneValid && isAddressValid;
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
              bankName: extractedBankName || null,
              bankAccountNumber: extractedBankAccountNumber || null,
              bankAccountHolder: extractedBankAccountHolder || null,
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
              bankName: extractedBankName || null,
              bankAccountNumber: extractedBankAccountNumber || null,
              bankAccountHolder: extractedBankAccountHolder || null,
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
