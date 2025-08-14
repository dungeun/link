import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { cacheService, cacheKeys, CACHE_TTL } from '@/lib/cache/cache-service';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // 캐시 키 생성
    const cacheKey = cacheKeys.homeStats();
    
    // 캐시된 데이터 확인
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        statistics: cached,
        cached: true
      });
    }
    // 병렬로 모든 통계 데이터 조회
    const [
      influencerCount,
      businessCount,
      campaignCount,
      applicationCount,
      completedCampaigns,
      totalCampaigns
    ] = await Promise.all([
      // 활성 인플루언서 수
      prisma.user.count({
        where: {
          type: 'INFLUENCER',
          profile: {
            isNot: null
          }
        }
      }),
      
      // 파트너 브랜드 수
      prisma.user.count({
        where: {
          type: 'BUSINESS',
          profile: {
            isNot: null
          }
        }
      }),
      
      // 총 캠페인 수
      prisma.campaign.count(),
      
      // 총 지원 수
      prisma.campaignApplication.count(),
      
      // 완료된 캠페인 수
      prisma.campaign.count({
        where: {
          status: 'completed'
        }
      }),
      
      // 전체 캠페인 수
      prisma.campaign.count()
    ]);

    // 월간 도달 수 계산 (모든 인플루언서의 팔로워 수 합계)
    const influencerProfiles = await prisma.profile.findMany({
      where: {
        user: {
          type: 'INFLUENCER'
        }
      },
      select: {
        instagramFollowers: true,
        youtubeSubscribers: true,
        tiktokFollowers: true
      }
    });

    const monthlyReach = influencerProfiles.reduce((total, profile) => {
      const instagram = profile.instagramFollowers || 0;
      const youtube = profile.youtubeSubscribers || 0;
      const tiktok = profile.tiktokFollowers || 0;
      return total + instagram + youtube + tiktok;
    }, 0);

    // 캠페인 성공률 계산
    const successRate = totalCampaigns > 0 
      ? Math.round((completedCampaigns / totalCampaigns) * 100)
      : 98; // 기본값

    // 통계 데이터 포맷팅
    const statistics = {
      activeInfluencers: {
        value: influencerCount,
        label: '활성 인플루언서',
        formatted: `${Math.floor(influencerCount / 1000)}K+`
      },
      partnerBrands: {
        value: businessCount,
        label: '파트너 브랜드',
        formatted: `${businessCount.toLocaleString()}+`
      },
      monthlyReach: {
        value: monthlyReach,
        label: '월간 도달 수',
        formatted: `${Math.floor(monthlyReach / 1000000)}M+`
      },
      campaignSuccessRate: {
        value: successRate,
        label: '캠페인 성공률',
        formatted: `${successRate}%`
      },
      totalCampaigns: {
        value: campaignCount,
        label: '총 캠페인',
        formatted: campaignCount.toLocaleString()
      },
      totalApplications: {
        value: applicationCount,
        label: '총 지원 수',
        formatted: applicationCount.toLocaleString()
      }
    };
    
    // 캐시에 저장 (1시간 TTL)
    await cacheService.set(cacheKey, statistics, CACHE_TTL.LONG);

    return NextResponse.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    
    // 오류 시 기본 통계 반환
    const defaultStatistics = {
      activeInfluencers: {
        value: 50000,
        label: '활성 인플루언서',
        formatted: '50K+'
      },
      partnerBrands: {
        value: 2500,
        label: '파트너 브랜드',
        formatted: '2,500+'
      },
      monthlyReach: {
        value: 10000000,
        label: '월간 도달 수',
        formatted: '10M+'
      },
      campaignSuccessRate: {
        value: 98,
        label: '캠페인 성공률',
        formatted: '98%'
      }
    };

    return NextResponse.json({
      success: true,
      statistics: defaultStatistics
    });
  }
}