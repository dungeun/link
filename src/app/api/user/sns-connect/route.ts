import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth-utils';
import { freeSocialScraperService } from '@/lib/services/free-social-scraper.service';

const prisma = new PrismaClient();

// SNS 플랫폼별 팔로워 수 가져오기 (무료 크롤링만 사용)
async function fetchFollowerCount(platform: string, username: string): Promise<{ followers: number; todayVisitors?: number }> {
  try {
    let stats = null;
    
    // 무료 웹크롤링 서비스 사용
    switch (platform) {
      case 'instagram':
        stats = await freeSocialScraperService.getInstagramStats(username);
        break;
        
      case 'youtube':
        stats = await freeSocialScraperService.getYouTubeStats(username);
        break;
        
      case 'tiktok':
        stats = await freeSocialScraperService.getTikTokStats(username);
        break;
        
      case 'naverBlog':
        stats = await freeSocialScraperService.getNaverBlogStats(username);
        console.log(`[fetchFollowerCount] Naver Blog stats:`, stats);
        break;
    }
    
    // 크롤링 성공시 반환
    if (stats && stats.followers > 0) {
      console.log(`[${platform}] Scraping success for ${username}: ${stats.followers} followers`);
      if (platform === 'naverBlog' && stats.todayVisitors !== undefined) {
        console.log(`[${platform}] Today visitors: ${stats.todayVisitors}`);
        return { followers: stats.followers, todayVisitors: stats.todayVisitors };
      }
      return { followers: stats.followers };
    }
    
    // 크롤링 실패시 0 반환 (데모 데이터 없음)
    console.log(`[${platform}] Scraping failed for ${username}`);
    return { followers: 0 };
    
  } catch (error) {
    console.error(`Failed to fetch ${platform} followers:`, error);
    return { followers: 0 };
  }
}

// GET: SNS 연동 상태 조회 (DB에서만 가져오기)
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 사용자 프로필 조회
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = userProfile.profile;
    const snsAccounts = [];

    // DB에 저장된 정보로 응답 구성
    if (profile?.instagram) {
      snsAccounts.push({
        platform: 'instagram',
        username: profile.instagram,
        isConnected: true,
        followers: profile.instagramFollowers || 0,
        lastUpdated: profile.snsLastUpdated || profile.updatedAt
      });
    }

    if (profile?.youtube) {
      snsAccounts.push({
        platform: 'youtube',
        username: profile.youtube,
        isConnected: true,
        followers: profile.youtubeSubscribers || 0,
        lastUpdated: profile.snsLastUpdated || profile.updatedAt
      });
    }

    if (profile?.tiktok) {
      snsAccounts.push({
        platform: 'tiktok',
        username: profile.tiktok,
        isConnected: true,
        followers: profile.tiktokFollowers || 0,
        lastUpdated: profile.snsLastUpdated || profile.updatedAt
      });
    }

    if (profile?.naverBlog) {
      snsAccounts.push({
        platform: 'naverBlog',
        username: profile.naverBlog,
        isConnected: true,
        followers: profile.naverBlogFollowers || 0,
        todayVisitors: profile.naverBlogTodayVisitors || 0,
        lastUpdated: profile.snsLastUpdated || profile.updatedAt
      });
    }

    // 연동되지 않은 플랫폼도 포함
    const platforms = ['instagram', 'youtube', 'tiktok', 'naverBlog'];
    const connectedPlatforms = snsAccounts.map(acc => acc.platform);
    
    platforms.forEach(platform => {
      if (!connectedPlatforms.includes(platform)) {
        snsAccounts.push({
          platform,
          username: null,
          isConnected: false,
          followers: 0,
          lastUpdated: null
        });
      }
    });

    // 총 팔로워 수 계산
    const totalFollowers = profile?.followerCount || snsAccounts.reduce((sum, acc) => sum + (acc.followers || 0), 0);

    return NextResponse.json({
      snsAccounts,
      totalFollowers,
      profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch SNS accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SNS accounts' },
      { status: 500 }
    );
  }
}

// POST: SNS 계정 연동/업데이트
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { platform, username, disconnect = false } = body;

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    // 프로필이 없으면 생성
    let profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId,
          bio: '',
          categories: null
        }
      });
    }

    // SNS 계정 업데이트
    const updateData: Record<string, string | null> = {};
    
    if (disconnect) {
      // 연동 해제
      updateData[platform] = null;
    } else {
      // 연동 또는 업데이트
      if (!username) {
        return NextResponse.json(
          { error: 'Username is required for connection' },
          { status: 400 }
        );
      }
      updateData[platform] = username;
    }

    // 프로필 업데이트
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData
    });

    // 팔로워 수 가져오고 DB에 저장
    let followers = 0;
    let todayVisitors = 0;
    if (!disconnect && username) {
      const result = await fetchFollowerCount(platform, username);
      followers = result.followers;
      todayVisitors = result.todayVisitors || 0;
      
      // 팔로워 수를 DB에 저장
      const followerUpdateData: Record<string, number | Date> = {};
      switch(platform) {
        case 'instagram':
          followerUpdateData.instagramFollowers = followers;
          break;
        case 'youtube':
          followerUpdateData.youtubeSubscribers = followers;
          break;
        case 'tiktok':
          followerUpdateData.tiktokFollowers = followers;
          break;
        case 'naverBlog':
          followerUpdateData.naverBlogFollowers = followers;
          followerUpdateData.naverBlogTodayVisitors = todayVisitors; // 0이어도 저장
          console.log(`[POST] Naver Blog update data:`, { followers, todayVisitors });
          break;
      }
      
      // 총 팔로워 수 재계산
      const currentProfile = await prisma.profile.findUnique({
        where: { userId }
      });
      
      if (currentProfile) {
        followerUpdateData.followerCount = 
          (platform === 'instagram' ? followers : currentProfile.instagramFollowers || 0) +
          (platform === 'youtube' ? followers : currentProfile.youtubeSubscribers || 0) +
          (platform === 'tiktok' ? followers : currentProfile.tiktokFollowers || 0) +
          (platform === 'naverBlog' ? followers : currentProfile.naverBlogFollowers || 0);
        
        followerUpdateData.snsLastUpdated = new Date();
        
        // DB 업데이트
        await prisma.profile.update({
          where: { userId },
          data: followerUpdateData
        });
      }
    }

    return NextResponse.json({
      success: true,
      platform,
      username: disconnect ? null : username,
      isConnected: !disconnect,
      followers,
      todayVisitors: platform === 'naverBlog' ? todayVisitors : undefined,
      lastUpdated: new Date()
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to update SNS account:', error);
    return NextResponse.json(
      { error: 'Failed to update SNS account' },
      { status: 500 }
    );
  }
}

// PUT: 팔로워 수 새로고침 (새로 가져와서 DB에 저장)
export async function PUT(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    // 사용자 프로필 조회
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const results: Array<{
      platform: string;
      username: string;
      followers: number;
      todayVisitors?: number;
      lastUpdated: Date;
    }> = [];
    const updateData: Record<string, number | Date> = {};

    // 특정 플랫폼만 업데이트하거나 전체 업데이트
    const platformsToUpdate = platform ? [platform] : ['instagram', 'youtube', 'tiktok', 'naverBlog'];

    for (const plat of platformsToUpdate) {
      const username = (profile as Record<string, unknown>)[plat] as string;
      if (username) {
        const result = await fetchFollowerCount(plat, username);
        const followers = result.followers;
        const todayVisitors = result.todayVisitors || 0;
        
        results.push({
          platform: plat,
          username,
          followers,
          todayVisitors: plat === 'naverBlog' ? todayVisitors : undefined,
          lastUpdated: new Date()
        });

        // DB 업데이트 데이터 준비
        switch(plat) {
          case 'instagram':
            updateData.instagramFollowers = followers;
            break;
          case 'youtube':
            updateData.youtubeSubscribers = followers;
            break;
          case 'tiktok':
            updateData.tiktokFollowers = followers;
            break;
          case 'naverBlog':
            updateData.naverBlogFollowers = followers;
            updateData.naverBlogTodayVisitors = todayVisitors; // 0이어도 저장
            console.log(`[PUT] Naver Blog update data:`, { followers, todayVisitors });
            break;
        }
      }
    }

    // 총 팔로워 수 재계산
    if (Object.keys(updateData).length > 0) {
      const currentFollowers = {
        instagram: profile.instagramFollowers || 0,
        youtube: profile.youtubeSubscribers || 0,
        tiktok: profile.tiktokFollowers || 0,
        naverBlog: profile.naverBlogFollowers || 0
      };

      // 업데이트된 값으로 덮어쓰기
      if (updateData.instagramFollowers !== undefined) currentFollowers.instagram = updateData.instagramFollowers;
      if (updateData.youtubeSubscribers !== undefined) currentFollowers.youtube = updateData.youtubeSubscribers;
      if (updateData.tiktokFollowers !== undefined) currentFollowers.tiktok = updateData.tiktokFollowers;
      if (updateData.naverBlogFollowers !== undefined) currentFollowers.naverBlog = updateData.naverBlogFollowers;

      updateData.followerCount = 
        currentFollowers.instagram +
        currentFollowers.youtube +
        currentFollowers.tiktok +
        currentFollowers.naverBlog;

      updateData.snsLastUpdated = new Date();

      // DB 업데이트
      await prisma.profile.update({
        where: { userId },
        data: updateData
      });
    }

    return NextResponse.json({
      success: true,
      updated: results
    }, { status: 200 });

  } catch (error) {
    console.error('Failed to refresh followers:', error);
    return NextResponse.json(
      { error: 'Failed to refresh followers' },
      { status: 500 }
    );
  }
}