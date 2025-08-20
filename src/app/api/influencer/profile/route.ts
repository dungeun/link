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

    // 프로필 완성 상태 실시간 검증
    const checkProfileCompleted = (profileData: any) => {
      if (!profileData) return false;
      
      const isRealNameValid = profileData.realName && String(profileData.realName).trim() !== '';
      const isBirthYearValid = profileData.birthYear && Number(profileData.birthYear) > 1900 && Number(profileData.birthYear) <= new Date().getFullYear();
      const isGenderValid = profileData.gender && ['male', 'female', 'other', '남성', '여성', '기타'].includes(String(profileData.gender));
      const isPhoneValid = profileData.phone && String(profileData.phone).trim() !== '';
      // 주소는 선택적 필드로 변경
      // const isAddressValid = profileData.address && String(profileData.address).trim() !== '';
      
      const isCompleted = isRealNameValid && isBirthYearValid && isGenderValid && isPhoneValid;
      
      console.log('Profile completion check (GET):', {
        realName: { valid: isRealNameValid, value: profileData.realName, type: typeof profileData.realName },
        birthYear: { valid: isBirthYearValid, value: profileData.birthYear, type: typeof profileData.birthYear },
        gender: { valid: isGenderValid, value: profileData.gender, type: typeof profileData.gender },
        phone: { valid: isPhoneValid, value: profileData.phone, type: typeof profileData.phone },
        result: isCompleted
      });
      
      return isCompleted;
    }

    const calculatedProfileCompleted = checkProfileCompleted(profile.profile);

    // 안전한 응답 데이터 구성
    const responseData = {
      id: profile.id,
      name: profile.name || '',
      email: profile.email || '',
      type: profile.type,
      profileCompleted: calculatedProfileCompleted,
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
        profileCompleted: calculatedProfileCompleted
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

    // 안전한 데이터 추출 (빈 문자열은 null로 변환)
    const safeExtract = (value: any) => {
      if (value === '' || value === undefined || value === null) {
        return null;
      }
      return value;
    };

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

    // 핵심 필드들의 빈 문자열 처리
    const cleanedData = {
      name: safeExtract(name),
      email: safeExtract(email),
      bio: safeExtract(bio),
      phone: safeExtract(phone),
      realName: safeExtract(realName),
      birthDate: safeExtract(birthDate),
      birthYear: birthYear ? Number(birthYear) : null,
      gender: safeExtract(gender),
      nationality: safeExtract(nationality),
      address: safeExtract(address),
      addressData,
      profileImage: safeExtract(profileImage),
      instagram: safeExtract(instagram),
      youtube: safeExtract(youtube),
      tiktok: safeExtract(tiktok),
      facebook: safeExtract(facebook),
      twitter: safeExtract(twitter),
      naverBlog: safeExtract(naverBlog),
      categories,
      bankName: safeExtract(bankName),
      bankAccountNumber: safeExtract(bankAccountNumber),
      bankAccountHolder: safeExtract(bankAccountHolder),
      bankingInfo
    };

    // bankingInfo 객체가 있으면 개별 필드로 추출
    let extractedBankName = cleanedData.bankName;
    let extractedBankAccountNumber = cleanedData.bankAccountNumber;
    let extractedBankAccountHolder = cleanedData.bankAccountHolder;

    if (cleanedData.bankingInfo) {
      if (cleanedData.bankingInfo.accountType === 'domestic') {
        extractedBankName = cleanedData.bankingInfo.domestic?.bankName || cleanedData.bankName;
        extractedBankAccountNumber = cleanedData.bankingInfo.domestic?.accountNumber || cleanedData.bankAccountNumber;
        extractedBankAccountHolder = cleanedData.bankingInfo.domestic?.accountHolder || cleanedData.bankAccountHolder;
      } else if (cleanedData.bankingInfo.accountType === 'international') {
        extractedBankName = cleanedData.bankingInfo.international?.bankEnglishName || cleanedData.bankName;
        extractedBankAccountNumber = cleanedData.bankingInfo.international?.accountNumber || cleanedData.bankAccountNumber;
        extractedBankAccountHolder = cleanedData.bankingInfo.international?.englishName || cleanedData.bankAccountHolder;
      }
    }

    // 생년월일 안전 처리
    let parsedBirthDate = undefined;
    if (cleanedData.birthDate) {
      try {
        const date = new Date(cleanedData.birthDate);
        if (!isNaN(date.getTime())) {
          parsedBirthDate = date;
        }
      } catch (e) {
        console.warn('Invalid birthDate format:', cleanedData.birthDate);
      }
    }

    // 카테고리 안전 처리
    let categoriesString = undefined;
    if (cleanedData.categories) {
      try {
        if (Array.isArray(cleanedData.categories)) {
          categoriesString = JSON.stringify(cleanedData.categories);
        } else if (typeof cleanedData.categories === 'string') {
          categoriesString = cleanedData.categories;
        }
      } catch (e) {
        console.warn('Failed to process categories:', e);
      }
    }

    // addressData 안전 처리
    let processedAddressData = null;
    if (cleanedData.addressData) {
      try {
        if (typeof cleanedData.addressData === 'object') {
          // Prisma JSON 필드로 직접 저장
          processedAddressData = cleanedData.addressData;
        } else if (typeof cleanedData.addressData === 'string') {
          processedAddressData = JSON.parse(cleanedData.addressData);
        }
      } catch (e) {
        console.warn('Failed to process addressData:', e);
        processedAddressData = null;
      }
    }

    // 기존 프로필 데이터 조회 (현재 상태 확인)
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        realName: true,
        birthYear: true,
        gender: true,
        phone: true,
        address: true,
        profileCompleted: true
      }
    });

    // 프로필 완성 상태 체크
    const checkProfileCompleted = (profileData: { 
      realName?: string; 
      birthYear?: number; 
      gender?: string; 
      phone?: string; 
      address?: string; 
    }) => {
      // 새로운 값이 없으면 기존 값 사용
      const currentRealName = profileData.realName !== undefined ? profileData.realName : existingProfile?.realName;
      const currentBirthYear = profileData.birthYear !== undefined ? profileData.birthYear : existingProfile?.birthYear;
      const currentGender = profileData.gender !== undefined ? profileData.gender : existingProfile?.gender;
      const currentPhone = profileData.phone !== undefined ? profileData.phone : existingProfile?.phone;
      const currentAddress = profileData.address !== undefined ? profileData.address : existingProfile?.address;
      
      // 필수 필드들 검증 (더 유연한 조건)
      const isRealNameValid = currentRealName && String(currentRealName).trim() !== '';
      const isBirthYearValid = currentBirthYear && Number(currentBirthYear) > 1900 && Number(currentBirthYear) <= new Date().getFullYear();
      const isGenderValid = currentGender && ['male', 'female', 'other', '남성', '여성', '기타'].includes(String(currentGender));
      const isPhoneValid = currentPhone && String(currentPhone).trim() !== '';
      const isAddressValid = currentAddress && String(currentAddress).trim() !== '';
      
      // 주소는 선택적 필드로 변경 (비즈니스 요구사항에 따라)
      const isCompleted = isRealNameValid && isBirthYearValid && isGenderValid && isPhoneValid; // && isAddressValid;
      
      console.log('Profile completion check:', {
        realName: { valid: isRealNameValid, value: currentRealName, type: typeof currentRealName },
        birthYear: { valid: isBirthYearValid, value: currentBirthYear, type: typeof currentBirthYear },
        gender: { valid: isGenderValid, value: currentGender, type: typeof currentGender },
        phone: { valid: isPhoneValid, value: currentPhone, type: typeof currentPhone },
        address: { valid: isAddressValid, value: currentAddress, type: typeof currentAddress },
        result: isCompleted
      });
      
      return isCompleted;
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: cleanedData.name || undefined,
        email: cleanedData.email || undefined,
        profile: {
          upsert: {
            create: {
              bio: cleanedData.bio,
              phone: cleanedData.phone,
              realName: cleanedData.realName,
              birthDate: parsedBirthDate,
              birthYear: cleanedData.birthYear,
              gender: cleanedData.gender,
              nationality: cleanedData.nationality,
              address: cleanedData.address,
              addressData: processedAddressData,
              profileImage: cleanedData.profileImage,
              instagram: cleanedData.instagram,
              youtube: cleanedData.youtube,
              tiktok: cleanedData.tiktok,
              facebook: cleanedData.facebook,
              twitter: cleanedData.twitter,
              naverBlog: cleanedData.naverBlog,
              categories: categoriesString,
              bankName: extractedBankName || null,
              bankAccountNumber: extractedBankAccountNumber || null,
              bankAccountHolder: extractedBankAccountHolder || null,
              profileCompleted: Boolean(checkProfileCompleted({
                realName: cleanedData.realName,
                birthYear: cleanedData.birthYear || undefined,
                gender: cleanedData.gender,
                phone: cleanedData.phone,
                address: cleanedData.address
              }))
            },
            update: {
              bio: cleanedData.bio,
              phone: cleanedData.phone,
              realName: cleanedData.realName,
              birthDate: parsedBirthDate,
              birthYear: cleanedData.birthYear,
              gender: cleanedData.gender,
              nationality: cleanedData.nationality,
              address: cleanedData.address,
              addressData: processedAddressData,
              profileImage: cleanedData.profileImage,
              instagram: cleanedData.instagram,
              youtube: cleanedData.youtube,
              tiktok: cleanedData.tiktok,
              facebook: cleanedData.facebook,
              twitter: cleanedData.twitter,
              naverBlog: cleanedData.naverBlog,
              categories: categoriesString,
              bankName: extractedBankName || null,
              bankAccountNumber: extractedBankAccountNumber || null,
              bankAccountHolder: extractedBankAccountHolder || null,
              profileCompleted: Boolean(checkProfileCompleted({
                realName: cleanedData.realName,
                birthYear: cleanedData.birthYear || undefined,
                gender: cleanedData.gender,
                phone: cleanedData.phone,
                address: cleanedData.address
              }))
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
        profileCompleted: updatedUser.profile?.profileCompleted || false,
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
