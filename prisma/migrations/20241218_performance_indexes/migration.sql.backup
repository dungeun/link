-- 성능 최적화를 위한 추가 인덱스

-- CampaignApplication 테이블 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_campaign_applications_campaign_deleted" 
ON "campaign_applications" ("campaignId", "deletedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_campaign_applications_status" 
ON "campaign_applications" ("status");

-- CampaignCategory 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_campaign_categories_primary" 
ON "campaign_categories" ("campaignId", "isPrimary") 
WHERE "isPrimary" = true;

-- Campaign 정렬용 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_campaigns_sorting" 
ON "campaigns" ("status", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_campaigns_active_end_date" 
ON "campaigns" ("status", "endDate") 
WHERE "status" = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_campaigns_view_count" 
ON "campaigns" ("viewCount" DESC);

-- Category 통계용 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_categories_active" 
ON "categories" ("isActive", "slug") 
WHERE "isActive" = true;