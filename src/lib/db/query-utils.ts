/**
 * Prisma 쿼리 최적화 유틸리티
 * N+1 문제 해결 및 성능 최적화를 위한 헬퍼 함수
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger/production';

/**
 * 캠페인 조회 시 기본 include 옵션
 * N+1 문제를 방지하기 위해 관련 데이터를 한 번에 로드
 */
export const campaignIncludeDefault = {
  business: {
    select: {
      id: true,
      companyName: true,
      businessName: true,
      contactEmail: true,
      category: true,
      logo: true,
    },
  },
  applications: {
    select: {
      id: true,
      status: true,
      appliedAt: true,
      acceptedAt: true,
      completedAt: true,
      rejectedAt: true,
      influencerId: true,
    },
  },
  reports: {
    select: {
      id: true,
      createdAt: true,
      status: true,
      influencerId: true,
    },
  },
  likes: {
    select: {
      id: true,
      userId: true,
      createdAt: true,
    },
  },
  savedByUsers: {
    select: {
      id: true,
      userId: true,
      campaignId: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      applications: true,
      reports: true,
      likes: true,
      savedByUsers: true,
    },
  },
} as const;

/**
 * Get campaigns with optimized includes to prevent N+1 queries
 * Legacy support for existing code
 */
export function getCampaignWithRelations(includeApplications: boolean = false) {
  return {
    business: {
      select: {
        id: true,
        companyName: true,
        businessName: true,
        category: true,
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
  prisma: PrismaClient,
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
  prisma: PrismaClient,
  model: string,
  updates: Array<{ id: string; data: Record<string, unknown> }>
) {
  const operations = updates.map(update =>
    (prisma as unknown as Record<string, { update: Function }>)[model].update({
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
  prisma: PrismaClient,
  model: string,
  id: string,
  cascadeModels?: string[]
) {
  const operations = [
    (prisma as unknown as Record<string, { update: Function }>)[model].update({
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
        (prisma as unknown as Record<string, { updateMany: Function }>)[cascadeModel].updateMany({
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
  prisma: PrismaClient,
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
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      logger.warn(`Slow query detected: ${queryName}`, { duration });
    } else {
      logger.debug(`Query executed: ${queryName}`, { duration });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Query failed: ${queryName}`, error, { duration });
    throw error;
  }
}