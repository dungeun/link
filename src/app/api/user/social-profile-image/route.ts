import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';

// GET: 소셜 로그인 프로필 이미지 가져오기
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

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    if (!provider || !['google', 'kakao', 'naver'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // 데이터베이스에서 해당 소셜 계정 정보 조회
    const socialAccount = await prisma.socialAccount.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider: provider
        }
      }
    });

    if (!socialAccount) {
      return NextResponse.json(
        { 
          error: `${provider} 소셜 계정이 연결되어 있지 않습니다.`,
          success: false,
          provider,
          imageUrl: null
        },
        { status: 404 }
      );
    }

    let imageUrl = socialAccount.profileImage;

    // 프로필 이미지가 저장되어 있지 않은 경우, API를 통해 가져오기 시도
    if (!imageUrl && socialAccount.accessToken) {
      try {
        switch (provider) {
          case 'google':
            // Google People API를 사용하여 프로필 정보 가져오기
            const googleResponse = await fetch('https://people.googleapis.com/v1/people/me?personFields=photos', {
              headers: {
                'Authorization': `Bearer ${socialAccount.accessToken}`
              }
            });
            
            if (googleResponse.ok) {
              const googleData = await googleResponse.json();
              if (googleData.photos && googleData.photos.length > 0) {
                imageUrl = googleData.photos[0].url;
              }
            }
            break;
            
          case 'kakao':
            // Kakao API를 사용하여 프로필 정보 가져오기
            const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
              headers: {
                'Authorization': `Bearer ${socialAccount.accessToken}`
              }
            });
            
            if (kakaoResponse.ok) {
              const kakaoData = await kakaoResponse.json();
              if (kakaoData.kakao_account?.profile?.profile_image_url) {
                imageUrl = kakaoData.kakao_account.profile.profile_image_url;
              }
            }
            break;
            
          case 'naver':
            // Naver API를 사용하여 프로필 정보 가져오기
            const naverResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
              headers: {
                'Authorization': `Bearer ${socialAccount.accessToken}`
              }
            });
            
            if (naverResponse.ok) {
              const naverData = await naverResponse.json();
              if (naverData.response?.profile_image) {
                imageUrl = naverData.response.profile_image;
              }
            }
            break;
        }

        // 새로운 프로필 이미지 URL을 데이터베이스에 저장
        if (imageUrl && imageUrl !== socialAccount.profileImage) {
          await prisma.socialAccount.update({
            where: {
              userId_provider: {
                userId: user.id,
                provider: provider
              }
            },
            data: {
              profileImage: imageUrl,
              updatedAt: new Date()
            }
          });
        }
      } catch (apiError) {
        console.error(`Failed to fetch ${provider} profile image:`, apiError);
        // API 호출이 실패해도 에러를 반환하지 않고, 저장된 이미지나 기본값 사용
      }
    }

    // 여전히 이미지가 없는 경우 기본 이미지 제공
    if (!imageUrl) {
      switch (provider) {
        case 'google':
          imageUrl = 'https://via.placeholder.com/150/4285f4/ffffff?text=Google';
          break;
        case 'kakao':
          imageUrl = 'https://via.placeholder.com/150/fee500/000000?text=Kakao';
          break;
        case 'naver':
          imageUrl = 'https://via.placeholder.com/150/03c75a/ffffff?text=Naver';
          break;
      }
    }

    return NextResponse.json({
      success: true,
      provider,
      imageUrl,
      isConnected: true
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to get social profile image:', error);
    return NextResponse.json(
      { error: 'Failed to get social profile image' },
      { status: 500 }
    );
  }
}