import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get category counts for active campaigns
    const categoryStats = await prisma.campaign.groupBy({
      by: ['id'],
      where: {
        status: 'ACTIVE',
        deletedAt: null
      },
      _count: {
        id: true
      }
    });

    // Get category breakdown using raw query for better performance

    // Alternative query using direct DB query for better performance
    const rawCategoryStats = await prisma.$queryRaw`
      SELECT 
        c.name,
        c.slug,
        COUNT(cc."campaignId") as count
      FROM "categories" c
      LEFT JOIN "campaign_categories" cc ON c.id = cc."categoryId"
      LEFT JOIN "campaigns" camp ON cc."campaignId" = camp.id 
        AND camp.status = 'ACTIVE' 
        AND camp."deletedAt" IS NULL
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.name
    ` as { name: string; slug: string; count: bigint }[];

    // Convert results to a more usable format
    const stats: { [key: string]: number } = {};
    let totalCount = 0;

    for (const stat of rawCategoryStats) {
      const count = Number(stat.count);
      stats[stat.name] = count;
      totalCount += count;
    }

    // Get total active campaigns count
    const totalCampaigns = await prisma.campaign.count({
      where: {
        status: 'ACTIVE',
        deletedAt: null
      }
    });

    return NextResponse.json({
      success: true,
      categoryStats: stats,
      totalCount: totalCampaigns
    });
  } catch (error) {
    console.error('Error fetching campaign statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch campaign statistics',
        categoryStats: {},
        totalCount: 0
      },
      { status: 500 }
    );
  }
}