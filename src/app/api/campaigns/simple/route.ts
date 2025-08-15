import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ACTIVE';
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    
    console.log('Simple API called with:', { status, limit, category, platform });
    
    // 필터 조건 구성
    const where: Record<string, unknown> = { status: status.toUpperCase() };
    
    if (platform && platform !== 'all') {
      where.platform = platform.toUpperCase();
    }
    
    // 간단한 캠페인 조회 - business 관계 없이
    const campaigns = await prisma.campaign.findMany({
      where,
      take: limit,
      select: {
        id: true,
        businessId: true,
        title: true,
        description: true,
        platform: true,
        budget: true,
        targetFollowers: true,
        startDate: true,
        endDate: true,
        imageUrl: true,
        status: true,
        maxApplicants: true,
        rewardAmount: true,
        createdAt: true,
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: [
        { status: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    console.log('Found campaigns count:', campaigns?.length);
    
    // business 정보를 별도로 조회
    const businessIds = campaigns.map(c => c.businessId);
    const businesses = await prisma.user.findMany({
      where: { id: { in: businessIds } },
      select: {
        id: true,
        name: true,
        businessProfile: {
          select: {
            companyName: true,
            businessCategory: true
          }
        }
      }
    });
    
    // 캠페인 데이터 포맷팅
    const formattedCampaigns = campaigns.map((campaign, index) => {
      const business = businesses.find(b => b.id === campaign.businessId);
      
      // 마감일까지 남은 일수 계산
      const today = new Date();
      const endDate = new Date(campaign.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return {
        id: campaign.id,
        title: campaign.title,
        brand: business?.businessProfile?.companyName || business?.name || 'Unknown',
        brand_name: business?.businessProfile?.companyName || business?.name || 'Unknown',
        description: campaign.description || '',
        budget: campaign.budget,
        deadline: Math.max(0, daysDiff),
        category: business?.businessProfile?.businessCategory || 'other',
        platforms: [campaign.platform.toLowerCase()],
        required_followers: campaign.targetFollowers,
        location: '전국',
        view_count: 0,
        applicants: campaign._count.applications,
        applicant_count: campaign._count.applications,
        maxApplicants: campaign.maxApplicants,
        rewardAmount: campaign.rewardAmount,
        imageUrl: campaign.imageUrl || '/images/campaigns/default.jpg',
        image_url: campaign.imageUrl || '/images/campaigns/default.jpg',
        tags: [],
        status: campaign.status.toLowerCase(),
        created_at: campaign.createdAt.toISOString(),
        createdAt: campaign.createdAt.toISOString(),
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        requirements: '',
        application_deadline: campaign.endDate
      };
    });
    
    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        page: 1,
        limit,
        total: formattedCampaigns.length,
        totalPages: 1
      },
      categoryStats: {}
    });
  } catch (error) {
    console.error('Simple API error:', error);
    return NextResponse.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        context: {
          endpoint: 'campaigns/simple',
          method: 'GET'
        }
      }
    }, { status: 500 });
  }
}