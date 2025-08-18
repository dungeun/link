import { NextRequest, NextResponse } from 'next/server';

// Dynamic route configuration
export const dynamic = 'force-dynamic'import { prisma } from '@/lib/db/prisma';

// Dynamic route configuration
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    console.log('Test API called');
    
    // 기본적인 캠페인 수 확인
    const totalCount = await prisma.campaign.count();
    console.log('Total campaigns:', totalCount);
    
    const activeCount = await prisma.campaign.count({
      where: { status: 'ACTIVE' }
    });
    console.log('Active campaigns:', activeCount);
    
    // 간단한 캠페인 조회
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        businessId: true
      }
    });
    
    console.log('Found campaigns:', campaigns);
    
    return NextResponse.json({
      success: true,
      totalCount,
      activeCount,
      campaigns
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}