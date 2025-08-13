import { Prisma, PrismaClient } from '@prisma/client';
import { performanceMonitor } from '@/lib/performance';

/**
 * Optimized query patterns for common operations
 */

/**
 * Get campaigns with optimized includes to prevent N+1 queries
 */
export function getCampaignWithRelations(includeApplications: boolean = false) {
  return {
    business: {
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
    },
    ...(includeApplications && {
      applications: {
        select: {
          id: true,
          status: true,
          influencerId: true
        }
      }
    }),
    _count: {
      select: {
        applications: true
      }
    }
  };
}

/**
 * Batch fetch campaigns with pagination
 */
export async function fetchCampaignsPaginated(
  prisma: any,
  options: {
    where?: Prisma.CampaignWhereInput;
    orderBy?: Prisma.CampaignOrderByWithRelationInput;
    page: number;
    limit: number;
  }
) {
  const { where, orderBy, page, limit } = options;
  const offset = (page - 1) * limit;

  // Use transaction for consistent reads
  const [campaigns, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: getCampaignWithRelations()
    }),
    prisma.campaign.count({ where })
  ]);

  return {
    campaigns,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get user with optimized profile loading
 */
export function getUserWithProfile() {
  return {
    profile: true,
    businessProfile: true,
    _count: {
      select: {
        campaigns: true,
        applications: true,
        posts: true
      }
    }
  };
}

/**
 * Batch update multiple records efficiently
 */
export async function batchUpdate<T>(
  prisma: any,
  model: string,
  updates: Array<{ id: string; data: any }>
) {
  const operations = updates.map(update =>
    (prisma[model] as any).update({
      where: { id: update.id },
      data: update.data
    })
  );

  return prisma.$transaction(operations);
}

/**
 * Soft delete with cascade
 */
export async function softDelete(
  prisma: any,
  model: string,
  id: string,
  cascadeModels?: string[]
) {
  const operations = [
    (prisma[model] as any).update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date()
      }
    })
  ];

  if (cascadeModels) {
    cascadeModels.forEach(cascadeModel => {
      operations.push(
        (prisma[cascadeModel] as any).updateMany({
          where: { [`${model}Id`]: id },
          data: {
            status: 'DELETED',
            deletedAt: new Date()
          }
        })
      );
    });
  }

  return prisma.$transaction(operations);
}

/**
 * Optimized aggregation queries
 */
export async function getAggregatedStats(
  prisma: any,
  dateRange: { start: Date; end: Date }
) {
  const [
    campaignStats,
    userStats,
    revenueStats
  ] = await prisma.$transaction([
    // Campaign statistics
    prisma.campaign.aggregate({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _count: true,
      _sum: {
        budget: true,
        rewardAmount: true
      }
    }),
    // User statistics
    prisma.user.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _count: true
    }),
    // Revenue statistics
    prisma.revenue.aggregate({
      where: {
        date: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _sum: {
        totalRevenue: true,
        platformFee: true,
        netProfit: true
      }
    })
  ]);

  return {
    campaigns: campaignStats,
    users: userStats,
    revenue: revenueStats
  };
}

/**
 * Connection pool optimization
 */
export function createOptimizedPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
}

/**
 * Query performance wrapper
 */
export async function withQueryMetrics<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure(`db.${queryName}`, queryFn);
}