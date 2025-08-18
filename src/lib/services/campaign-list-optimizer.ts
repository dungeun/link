/**
 * 쇼핑몰 스타일 고성능 캠페인 리스트 최적화
 */

import { prisma } from '@/lib/db/prisma';
import { QueryCache } from '@/lib/utils/redis-cache';

interface ListOptions {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
  cursor?: string; // 커서 기반 페이징용
}

export class CampaignListOptimizer {
  // 1. 집계 데이터 사전 계산 및 캐싱
  private static async precomputeAggregates() {
    const key = 'campaign:aggregates';
    
    return QueryCache.wrap(key, async () => {
      // 단일 쿼리로 모든 집계 데이터 가져오기
      const [totalCount, categoryStats, priceRanges] = await Promise.all([
        prisma.campaign.count({ where: { status: 'ACTIVE', deletedAt: null } }),
        
        // 카테고리별 통계
        prisma.$queryRaw`
          SELECT 
            c.slug as category,
            COUNT(*)::int as count,
            MIN(camp.budget)::int as min_price,
            MAX(camp.budget)::int as max_price,
            AVG(camp.budget)::int as avg_price
          FROM campaigns camp
          JOIN campaign_categories cc ON camp.id = cc."campaignId"
          JOIN categories c ON cc."categoryId" = c.id
          WHERE camp.status = 'ACTIVE' AND camp."deletedAt" IS NULL
          GROUP BY c.slug
        `,
        
        // 가격대별 분포
        prisma.$queryRaw`
          SELECT 
            CASE 
              WHEN budget < 100000 THEN 'under_100k'
              WHEN budget < 500000 THEN '100k_500k'
              WHEN budget < 1000000 THEN '500k_1m'
              ELSE 'over_1m'
            END as price_range,
            COUNT(*)::int as count
          FROM campaigns
          WHERE status = 'ACTIVE' AND "deletedAt" IS NULL
          GROUP BY price_range
        `
      ]);

      return { totalCount, categoryStats, priceRanges };
    }, 5 * 60 * 1000); // 5분 캐싱
  }

  // 2. 커서 기반 무한 스크롤 (오프셋 대신)
  static async getCursorPaginated(options: ListOptions) {
    const { cursor, limit = 20, category, sort = 'latest' } = options;
    
    const cacheKey = `campaigns:cursor:${cursor}:${limit}:${category}:${sort}`;
    
    return QueryCache.wrap(cacheKey, async () => {
      const where: any = {
        status: 'ACTIVE',
        deletedAt: null
      };

      if (category) {
        where.categories = {
          some: { category: { slug: category } }
        };
      }

      // 정렬 최적화
      let orderBy: any;
      switch (sort) {
        case 'price_low':
          orderBy = { budget: 'asc' };
          break;
        case 'price_high':
          orderBy = { budget: 'desc' };
          break;
        case 'popular':
          orderBy = { viewCount: 'desc' };
          break;
        case 'ending_soon':
          orderBy = { endDate: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      const campaigns = await prisma.campaign.findMany({
        where,
        orderBy,
        take: limit + 1, // 다음 페이지 존재 여부 확인용
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        select: {
          id: true,
          title: true,
          budget: true,
          endDate: true,
          thumbnailImageUrl: true,
          viewCount: true,
          maxApplicants: true,
          business: {
            select: {
              name: true,
              businessProfile: {
                select: { companyName: true }
              }
            }
          },
          _count: {
            select: { applications: true }
          },
          categories: {
            select: {
              category: {
                select: { name: true, slug: true }
              },
              isPrimary: true
            },
            where: { isPrimary: true },
            take: 1
          }
        }
      });

      const hasMore = campaigns.length > limit;
      const items = hasMore ? campaigns.slice(0, -1) : campaigns;
      const nextCursor = hasMore ? items[items.length - 1]?.id : null;

      return {
        items,
        nextCursor,
        hasMore
      };
    }, 60 * 1000); // 1분 캐싱
  }

  // 3. 프리페칭 - 다음 데이터 미리 로드
  static prefetchNext(currentCursor: string, options: ListOptions) {
    // 비동기로 다음 페이지 미리 캐싱
    setTimeout(() => {
      this.getCursorPaginated({ ...options, cursor: currentCursor });
    }, 100);
  }

  // 4. 필터 옵션 최적화 (사용 가능한 필터만 표시)
  static async getAvailableFilters(currentFilters: any = {}) {
    const key = `filters:${JSON.stringify(currentFilters)}`;
    
    return QueryCache.wrap(key, async () => {
      // 현재 필터 상태에서 사용 가능한 옵션만 조회
      const where = this.buildWhereClause(currentFilters);
      
      const [categories, priceRanges, platforms] = await Promise.all([
        // 사용 가능한 카테고리
        prisma.$queryRaw`
          SELECT DISTINCT c.slug, c.name, COUNT(*)::int as count
          FROM campaigns camp
          JOIN campaign_categories cc ON camp.id = cc."campaignId"
          JOIN categories c ON cc."categoryId" = c.id
          WHERE camp.status = 'ACTIVE' AND camp."deletedAt" IS NULL
          GROUP BY c.slug, c.name
          HAVING COUNT(*) > 0
          ORDER BY count DESC
        `,
        
        // 가격 범위
        prisma.campaign.aggregate({
          where,
          _min: { budget: true },
          _max: { budget: true },
          _avg: { budget: true }
        }),
        
        // 플랫폼
        prisma.campaign.groupBy({
          by: ['platform'],
          where,
          _count: true
        })
      ]);

      return { categories, priceRanges, platforms };
    }, 3 * 60 * 1000); // 3분 캐싱
  }

  // 5. 검색 최적화 (Full Text Search)
  static async searchOptimized(query: string, options: ListOptions) {
    if (!query || query.length < 2) return { items: [], total: 0 };

    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    
    return QueryCache.wrap(cacheKey, async () => {
      // PostgreSQL Full Text Search 사용
      const campaigns = await prisma.$queryRaw`
        SELECT 
          c.*,
          ts_rank(
            to_tsvector('korean', c.title || ' ' || c.description),
            plainto_tsquery('korean', ${query})
          ) as relevance
        FROM campaigns c
        WHERE 
          c.status = 'ACTIVE' 
          AND c."deletedAt" IS NULL
          AND (
            to_tsvector('korean', c.title || ' ' || c.description) 
            @@ plainto_tsquery('korean', ${query})
            OR c.title ILIKE ${'%' + query + '%'}
          )
        ORDER BY relevance DESC, c."createdAt" DESC
        LIMIT ${options.limit || 20}
        OFFSET ${((options.page || 1) - 1) * (options.limit || 20)}
      `;

      return campaigns;
    }, 2 * 60 * 1000);
  }

  // 6. 배치 로딩 최적화
  static async batchLoad(ids: string[]) {
    if (ids.length === 0) return [];

    // DataLoader 패턴 구현
    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        budget: true,
        thumbnailImageUrl: true,
        // 최소한의 필드만 선택
      }
    });

    // ID 순서 유지
    const campaignMap = new Map(campaigns.map(c => [c.id, c]));
    return ids.map(id => campaignMap.get(id)).filter(Boolean);
  }

  // 7. 스마트 캐시 워밍
  static async warmPopularCaches() {
    console.log('Warming popular caches...');
    
    const popularQueries = [
      { sort: 'latest', limit: 20 },
      { sort: 'popular', limit: 20 },
      { category: 'beauty', limit: 20 },
      { category: 'fashion', limit: 20 },
    ];

    // 병렬로 캐시 워밍
    await Promise.all(
      popularQueries.map(query => 
        this.getCursorPaginated(query).catch(console.error)
      )
    );

    // 집계 데이터도 미리 계산
    await this.precomputeAggregates();
    
    console.log('Cache warming completed');
  }

  // Helper: WHERE 절 생성
  private static buildWhereClause(filters: any) {
    const where: any = {
      status: 'ACTIVE',
      deletedAt: null
    };

    if (filters.category) {
      where.categories = {
        some: { category: { slug: filters.category } }
      };
    }

    if (filters.minPrice || filters.maxPrice) {
      where.budget = {};
      if (filters.minPrice) where.budget.gte = filters.minPrice;
      if (filters.maxPrice) where.budget.lte = filters.maxPrice;
    }

    if (filters.platform) {
      where.platform = filters.platform;
    }

    return where;
  }
}

// 서버 시작 시 캐시 워밍
if (typeof window === 'undefined') {
  // 5초 후 캐시 워밍 시작
  setTimeout(() => {
    CampaignListOptimizer.warmPopularCaches();
  }, 5000);

  // 30분마다 캐시 갱신
  setInterval(() => {
    CampaignListOptimizer.warmPopularCaches();
  }, 30 * 60 * 1000);
}