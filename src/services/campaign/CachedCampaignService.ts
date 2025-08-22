/**
 * Cached Campaign Service
 * Multi-layer 캐싱이 적용된 캠페인 서비스
 */

import { Campaign } from "@prisma/client";
import {
  cache,
  Cacheable,
  InvalidateCache,
  MultiLayerCache,
} from "@/lib/cache/MultiLayerCache";
import { campaignService } from "./CampaignService";

export class CachedCampaignService {
  private static instance: CachedCampaignService;

  private constructor() {}

  public static getInstance(): CachedCampaignService {
    if (!CachedCampaignService.instance) {
      CachedCampaignService.instance = new CachedCampaignService();
    }
    return CachedCampaignService.instance;
  }

  // 캠페인 단일 조회 (캐시 적용)
  async getCampaign(id: string): Promise<Campaign | null> {
    const cacheKey = MultiLayerCache.createKey("campaign", id);

    return cache.get(cacheKey, () => campaignService.getCampaign(id), {
      ttl: 600, // 10분
      layer: "all",
      refreshOnHit: true, // 히트 시 백그라운드 갱신
    });
  }

  // 캠페인 목록 조회 (캐시 적용)
  async listCampaigns(filters: any = {}, pagination: any = {}) {
    const cacheKey = MultiLayerCache.createKey("campaigns", filters, pagination);
    
    return cache.get(cacheKey, () => campaignService.listCampaigns(filters, pagination), {
      ttl: 300,
      layer: "all"
    });
  }

  // 인기 캠페인 조회 (자주 접근되는 데이터)
  async getPopularCampaigns(limit = 10): Promise<Campaign[]> {
    const cacheKey = MultiLayerCache.createKey("campaigns:popular", limit);

    return cache.get(
      cacheKey,
      async () => {
        const result = await campaignService.listCampaigns(
          { status: "ACTIVE" },
          { limit, page: 1 },
        );
        return result.campaigns;
      },
      {
        ttl: 1800, // 30분 (인기 캠페인은 자주 변하지 않음)
        layer: "all",
      },
    );
  }

  // 최신 캠페인 조회
  async getRecentCampaigns(limit = 20): Promise<Campaign[]> {
    const cacheKey = MultiLayerCache.createKey("campaigns:recent", limit);

    return cache.get(
      cacheKey,
      async () => {
        const result = await campaignService.listCampaigns(
          { status: "ACTIVE" },
          { limit, page: 1 },
        );
        return result.campaigns;
      },
      {
        ttl: 60, // 1분 (최신 데이터는 자주 갱신)
        layer: "redis", // 메모리 캐시는 건너뛰고 Redis만 사용
      },
    );
  }

  // 카테고리별 캠페인 조회
  async getCampaignsByCategory(category: string, page = 1, limit = 20) {
    const cacheKey = MultiLayerCache.createKey(
      "campaigns:category",
      category,
      page,
      limit,
    );

    return cache.get(
      cacheKey,
      () =>
        campaignService.listCampaigns(
          { category, status: "ACTIVE" },
          { page, limit },
        ),
      {
        ttl: 300, // 5분
        layer: "all",
      },
    );
  }

  // 사용자별 캠페인 조회
  async getUserCampaigns(userId: string, page = 1, limit = 20) {
    const cacheKey = MultiLayerCache.createKey(
      "campaigns:user",
      userId,
      page,
      limit,
    );

    return cache.get(
      cacheKey,
      () => campaignService.listCampaigns({ userId }, { page, limit }),
      {
        ttl: 180, // 3분
        layer: "memory", // 개인 데이터는 메모리 캐시만 사용
      },
    );
  }

  // === Write Operations (캐시 무효화 포함) ===

  // 캠페인 생성 (관련 캐시 무효화)
  async createCampaign(data: any): Promise<Campaign> {
    const campaign = await campaignService.createCampaign(data);

    // 관련 캐시 무효화
    await cache.invalidatePattern("campaigns:*");

    // 생성된 캠페인 즉시 캐싱
    const cacheKey = MultiLayerCache.createKey("campaign", campaign.id);
    await cache.set(cacheKey, campaign, { ttl: 600 });

    return campaign;
  }

  // 캠페인 업데이트 (특정 캐시 무효화)
  async updateCampaign(
    id: string,
    data: any,
    userId: string,
  ): Promise<Campaign> {
    const campaign = await campaignService.updateCampaign(id, data, userId);

    // 특정 캠페인 캐시 무효화
    await cache.delete(MultiLayerCache.createKey("campaign", id));

    // 관련 목록 캐시 무효화
    await cache.invalidate("campaigns:*");

    // 업데이트된 캠페인 캐싱
    const cacheKey = MultiLayerCache.createKey("campaign", campaign.id);
    await cache.set(cacheKey, campaign, { ttl: 600 });

    return campaign;
  }

  // 캠페인 활성화
  async activateCampaign(id: string, userId: string): Promise<void> {
    await campaignService.activateCampaign(id, userId);

    // 캐시 무효화
    await cache.delete(MultiLayerCache.createKey("campaign", id));
    await cache.invalidate("campaigns:*");
  }

  // === Cache Management ===

  // 캐시 예열 (서버 시작 시 호출)
  async warmCache(): Promise<void> {
    console.log("[CachedCampaignService] Warming cache...");

    const warmingTasks = [
      // 인기 캠페인 예열
      {
        key: MultiLayerCache.createKey("campaigns:popular", 10),
        fetcher: async () => {
          const result = await campaignService.listCampaigns(
            { status: "ACTIVE" },
            { limit: 10, page: 1 },
          );
          return result.campaigns;
        },
        ttl: 1800,
      },
      // 최신 캠페인 예열
      {
        key: MultiLayerCache.createKey("campaigns:recent", 20),
        fetcher: async () => {
          const result = await campaignService.listCampaigns(
            { status: "ACTIVE" },
            { limit: 20, page: 1 },
          );
          return result.campaigns;
        },
        ttl: 60,
      },
    ];

    await cache.warm(warmingTasks);

    console.log("[CachedCampaignService] Cache warming completed");
  }

  // 캐시 통계 조회
  getCacheStats() {
    return cache.getStats();
  }

  // 캐시 정보 조회
  getCacheInfo() {
    return cache.getInfo();
  }

  // 캐시 초기화
  async clearCache(): Promise<void> {
    await cache.clear();
  }

  // 특정 패턴 캐시 무효화
  async invalidatePattern(pattern: string): Promise<void> {
    await cache.invalidate(pattern);
  }
}

// 싱글톤 인스턴스 export
export const cachedCampaignService = CachedCampaignService.getInstance();
