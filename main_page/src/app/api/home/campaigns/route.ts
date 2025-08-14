import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { cacheService, cacheKeys, CACHE_TTL } from '@/lib/cache/cache-service';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 캐시 키 생성
    const cacheKey = cacheKeys.homeCampaigns(filter);
    
    // 캐시된 데이터 확인
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        campaigns: cached,
        cached: true
      });
    }

    // 캠페인 조회 쿼리 기본 설정
    const baseQuery = {
      include: {
        business: {
          select: {
            id: true,
            email: true,
            name: true,
            businessProfile: {
              select: {
                companyName: true,
                businessNumber: true,
                businessCategory: true
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    };

    let campaigns;
    
    // 필터에 따른 정렬
    switch(filter) {
      case 'popular':
        campaigns = await prisma.campaign.findMany({
          ...baseQuery,
          where: {
            status: 'ACTIVE' // 승인된 캠페인만
          },
          orderBy: {
            applications: {
              _count: 'desc'
            }
          },
          take: limit
        });
        break;
        
      case 'deadline':
        // 마감 임박순 (마감일이 현재 시점에서 가까운 순)
        campaigns = await prisma.campaign.findMany({
          ...baseQuery,
          where: {
            status: 'ACTIVE', // 승인된 캠페인만
            endDate: {
              gte: new Date() // 아직 마감되지 않은 캠페인만
            }
          },
          orderBy: {
            endDate: 'asc'
          },
          take: limit
        });
        break;
        
      case 'new':
        // 신규 캠페인 (최근 등록순)
        campaigns = await prisma.campaign.findMany({
          ...baseQuery,
          where: {
            status: 'ACTIVE' // 승인된 캠페인만
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit
        });
        break;
        
      default:
        // 전체 (인기도와 최신순을 조합)
        campaigns = await prisma.campaign.findMany({
          ...baseQuery,
          where: {
            status: 'ACTIVE' // 승인된 캠페인만
          },
          orderBy: [
            {
              applications: {
                _count: 'desc'
              }
            },
            {
              createdAt: 'desc'
            }
          ],
          take: limit
        });
    }

    // 데이터 포맷팅
    const formattedCampaigns = campaigns.map((campaign, index) => {
      const now = new Date();
      const endDate = new Date(campaign.endDate);
      const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        id: campaign.id,
        rank: index + 1,
        title: campaign.title,
        brand: campaign.business.businessProfile?.companyName || campaign.business.name || campaign.business.email,
        applicants: campaign._count.applications,
        maxApplicants: campaign.maxApplicants || 100, // 목표 지원자 수
        deadline: daysLeft,
        category: campaign.business.businessProfile?.businessCategory || '기타',
        platforms: [campaign.platform.toLowerCase()],
        description: campaign.description || '',
        createdAt: campaign.createdAt,
        budget: `${campaign.budget.toLocaleString()}원`,
        imageUrl: campaign.imageUrl
      };
    });
    
    // 캐시에 저장 (5분 TTL)
    await cacheService.set(cacheKey, formattedCampaigns, CACHE_TTL.MEDIUM);

    return NextResponse.json({
      success: true,
      campaigns: formattedCampaigns,
      total: formattedCampaigns.length
    });

  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    
    // 데이터베이스 연결 실패 시 빈 배열 반환
    return NextResponse.json({
      success: true,
      campaigns: [],
      total: 0,
      message: 'Database connection failed, showing empty results'
    });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.warn('Failed to disconnect Prisma:', e);
    }
  }
}