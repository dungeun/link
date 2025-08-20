/**
 * 캐시 무효화 로직 통일 서비스
 * 데이터 변경 시 관련된 모든 캐시를 일관성 있게 무효화
 */

import { UnifiedCache } from '../cache/unified-cache.service';

export interface InvalidationEvent {
  type: 'create' | 'update' | 'delete';
  entity: 'campaign' | 'user' | 'application' | 'content' | 'payment' | 'category';
  entityId: string;
  relatedEntities?: {
    type: string;
    id: string;
  }[];
  metadata?: Record<string, any>;
}

export class CacheInvalidationService {
  /**
   * 메인 무효화 메소드
   */
  static async invalidate(event: InvalidationEvent) {
    console.log('Cache invalidation:', event);

    try {
      switch (event.entity) {
        case 'campaign':
          await this.invalidateCampaignCache(event);
          break;
        case 'user':
          await this.invalidateUserCache(event);
          break;
        case 'application':
          await this.invalidateApplicationCache(event);
          break;
        case 'content':
          await this.invalidateContentCache(event);
          break;
        case 'payment':
          await this.invalidatePaymentCache(event);
          break;
        case 'category':
          await this.invalidateCategoryCache(event);
          break;
        default:
          console.warn('Unknown entity type for cache invalidation:', event.entity);
      }

      // 관련 엔티티들의 캐시도 무효화
      if (event.relatedEntities) {
        for (const related of event.relatedEntities) {
          await this.invalidate({
            type: event.type,
            entity: related.type as any,
            entityId: related.id
          });
        }
      }

    } catch (error) {
      console.error('Cache invalidation failed:', error, event);
      // 캐시 무효화 실패는 시스템 동작을 막지 않음
    }
  }

  /**
   * 캠페인 관련 캐시 무효화
   */
  private static async invalidateCampaignCache(event: InvalidationEvent) {
    const { type, entityId } = event;

    // 1. 캠페인 상세 캐시 무효화
    await UnifiedCache.campaigns.invalidate(`detail:${entityId}`);

    // 2. 캠페인 목록 캐시 전체 무효화 (필터링이 복잡하므로)
    await UnifiedCache.campaigns.flush();

    // 3. 관리자 통계 캐시 무효화
    await UnifiedCache.admin.flush();

    // 4. 비즈니스별 캐시 무효화
    if (event.metadata?.businessId) {
      await UnifiedCache.users.invalidatePattern(`business:${event.metadata.businessId}:*`);
    }

    // 5. 카테고리별 캐시 무효화
    if (event.metadata?.categoryIds) {
      for (const categoryId of event.metadata.categoryIds) {
        await UnifiedCache.campaigns.invalidatePattern(`category:${categoryId}:*`);
      }
    }

    // 6. 해시태그 검색 캐시 무효화
    if (event.metadata?.hashtags) {
      await UnifiedCache.campaigns.invalidatePattern('hashtag_search:*');
    }

    console.log(`Campaign cache invalidated: ${type} ${entityId}`);
  }

  /**
   * 사용자 관련 캐시 무효화
   */
  private static async invalidateUserCache(event: InvalidationEvent) {
    const { type, entityId } = event;

    // 1. 사용자 상세 캐시 무효화
    await UnifiedCache.users.invalidate(`detail:${entityId}`);

    // 2. 사용자 목록 캐시 무효화
    await UnifiedCache.users.flush();

    // 3. 관리자 통계 캐시 무효화
    await UnifiedCache.admin.flush();

    // 4. 사용자 타입별 캐시 무효화
    if (event.metadata?.userType) {
      await UnifiedCache.users.invalidatePattern(`type:${event.metadata.userType}:*`);
    }

    // 5. 비즈니스 사용자인 경우 관련 캠페인 캐시도 무효화
    if (event.metadata?.userType === 'BUSINESS') {
      await UnifiedCache.campaigns.invalidatePattern(`business:${entityId}:*`);
    }

    console.log(`User cache invalidated: ${type} ${entityId}`);
  }

  /**
   * 지원서 관련 캐시 무효화
   */
  private static async invalidateApplicationCache(event: InvalidationEvent) {
    const { type, entityId } = event;

    // 1. 지원서 목록 캐시 무효화
    await UnifiedCache.responses.flush();

    // 2. 관련 캠페인 캐시 무효화
    if (event.metadata?.campaignId) {
      await this.invalidateCampaignCache({
        type,
        entity: 'campaign',
        entityId: event.metadata.campaignId
      });
    }

    // 3. 관련 사용자 캐시 무효화
    if (event.metadata?.influencerId) {
      await UnifiedCache.users.invalidatePattern(`user:${event.metadata.influencerId}:*`);
    }

    // 4. 관리자 통계 캐시 무효화
    await UnifiedCache.admin.flush();

    console.log(`Application cache invalidated: ${type} ${entityId}`);
  }

  /**
   * 콘텐츠 관련 캐시 무효화
   */
  private static async invalidateContentCache(event: InvalidationEvent) {
    const { type, entityId } = event;

    // 1. 콘텐츠 캐시 무효화
    await UnifiedCache.responses.invalidate(entityId);

    // 2. 관련 지원서 및 캠페인 캐시 무효화
    if (event.metadata?.applicationId) {
      await this.invalidateApplicationCache({
        type,
        entity: 'application',
        entityId: event.metadata.applicationId,
        metadata: event.metadata
      });
    }

    console.log(`Content cache invalidated: ${type} ${entityId}`);
  }

  /**
   * 결제 관련 캐시 무효화
   */
  private static async invalidatePaymentCache(event: InvalidationEvent) {
    const { type, entityId } = event;

    // 1. 결제 캐시 무효화
    await UnifiedCache.responses.flush();

    // 2. 사용자 캐시 무효화
    if (event.metadata?.userId) {
      await UnifiedCache.users.invalidatePattern(`user:${event.metadata.userId}:*`);
    }

    // 3. 관련 캠페인 캐시 무효화
    if (event.metadata?.campaignId) {
      await this.invalidateCampaignCache({
        type,
        entity: 'campaign',
        entityId: event.metadata.campaignId
      });
    }

    // 4. 관리자 통계 캐시 무효화
    await UnifiedCache.admin.flush();

    console.log(`Payment cache invalidated: ${type} ${entityId}`);
  }

  /**
   * 카테고리 관련 캐시 무효화
   */
  private static async invalidateCategoryCache(event: InvalidationEvent) {
    const { type, entityId } = event;

    // 1. 카테고리 캐시 무효화
    await UnifiedCache.categories.flush();

    // 2. 관련 캠페인 캐시 무효화 (카테고리 변경은 캠페인 목록에 영향)
    await UnifiedCache.campaigns.flush();

    // 3. 관리자 통계 캐시 무효화
    await UnifiedCache.admin.flush();

    console.log(`Category cache invalidated: ${type} ${entityId}`);
  }

  /**
   * 스마트 무효화 - 관련성에 따른 선택적 무효화
   */
  static async smartInvalidate(
    entity: string,
    entityId: string,
    changedFields: string[] = []
  ) {
    // 변경된 필드에 따라 필요한 캐시만 무효화
    const invalidationMap: Record<string, Record<string, string[]>> = {
      campaign: {
        'title,description': ['campaigns:list', 'campaigns:search'],
        'status': ['campaigns:list', 'admin:stats'],
        'budget,rewardAmount': ['campaigns:list', 'campaigns:ranking'],
        'hashtags': ['campaigns:hashtag_search'],
        'categories': ['campaigns:category', 'categories:stats']
      },
      user: {
        'name,email': ['users:list', 'users:search'],
        'type': ['users:type', 'admin:stats'],
        'isVerified': ['users:verified', 'admin:stats']
      }
    };

    const entityMap = invalidationMap[entity];
    if (!entityMap) {
      // 매핑이 없으면 전체 무효화
      return this.invalidate({
        type: 'update',
        entity: entity as any,
        entityId
      });
    }

    // 변경된 필드에 맞는 캐시만 무효화
    const cachesToInvalidate = new Set<string>();
    for (const field of changedFields) {
      for (const [fieldPattern, caches] of Object.entries(entityMap)) {
        if (fieldPattern.split(',').includes(field)) {
          caches.forEach(cache => cachesToInvalidate.add(cache));
        }
      }
    }

    // 선택적 캐시 무효화 실행
    for (const cachePattern of cachesToInvalidate) {
      const [namespace, key] = cachePattern.split(':');
      
      // 타입 안전한 캐시 접근
      let cacheNamespace;
      switch (namespace) {
        case 'campaigns':
          cacheNamespace = UnifiedCache.campaigns;
          break;
        case 'users':
          cacheNamespace = UnifiedCache.users;
          break;
        case 'admin':
          cacheNamespace = UnifiedCache.admin;
          break;
        case 'stats':
          cacheNamespace = UnifiedCache.stats;
          break;
        case 'categories':
          cacheNamespace = UnifiedCache.categories;
          break;
        case 'responses':
          cacheNamespace = UnifiedCache.responses;
          break;
        default:
          console.warn(`Unknown cache namespace: ${namespace}`);
          continue;
      }
      
      if (key) {
        await cacheNamespace.invalidatePattern(`${key}:*`);
      } else {
        await cacheNamespace.flush();
      }
    }

    console.log(`Smart cache invalidation: ${entity}:${entityId} fields:${changedFields.join(',')} caches:${Array.from(cachesToInvalidate).join(',')}`);
  }

  /**
   * 전체 캐시 무효화 (비상시 사용)
   */
  static async invalidateAll() {
    console.log('Invalidating all caches');

    await Promise.all([
      UnifiedCache.campaigns.flush(),
      UnifiedCache.users.flush(),
      UnifiedCache.responses.flush(),
      UnifiedCache.responses.flush(),
      UnifiedCache.responses.flush(),
      UnifiedCache.categories.flush(),
      UnifiedCache.admin.flush()
    ]);

    console.log('All caches invalidated');
  }

  /**
   * 캐시 무효화 이벤트 생성 헬퍼
   */
  static createEvent(
    type: 'create' | 'update' | 'delete',
    entity: 'campaign' | 'user' | 'application' | 'content' | 'payment' | 'category',
    entityId: string,
    metadata?: Record<string, any>
  ): InvalidationEvent {
    return {
      type,
      entity,
      entityId,
      metadata
    };
  }

  /**
   * 배치 무효화 - 여러 이벤트를 한 번에 처리
   */
  static async batchInvalidate(events: InvalidationEvent[]) {
    console.log(`Batch cache invalidation: ${events.length} events`);

    // 중복 제거를 위한 Set 사용
    const uniqueInvalidations = new Set<string>();

    for (const event of events) {
      const key = `${event.entity}:${event.entityId}:${event.type}`;
      if (!uniqueInvalidations.has(key)) {
        uniqueInvalidations.add(key);
        await this.invalidate(event);
      }
    }

    console.log(`Batch cache invalidation completed: ${uniqueInvalidations.size} unique invalidations`);
  }
}