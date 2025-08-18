-- 캠페인 성능 최적화를 위한 인덱스 추가

-- 1. 메인 필터링용 복합 인덱스
CREATE INDEX idx_campaigns_filter ON "campaigns" (status, "deletedAt", platform, "endDate");

-- 2. 정렬용 인덱스
CREATE INDEX idx_campaigns_sort_applicants ON "campaigns" (status, "deletedAt") INCLUDE ("createdAt");
CREATE INDEX idx_campaigns_sort_budget ON "campaigns" (status, "deletedAt", budget);
CREATE INDEX idx_campaigns_sort_deadline ON "campaigns" (status, "deletedAt", "endDate");

-- 3. 비즈니스 ID 인덱스 (이미 있을 수 있음)
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON "campaigns" ("businessId");

-- 4. 생성일 인덱스 (기본 정렬용)
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON "campaigns" ("createdAt");

-- 5. 카테고리 조인용 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_categories_campaign_id ON "campaign_categories" ("campaignId");
CREATE INDEX IF NOT EXISTS idx_campaign_categories_category_id ON "campaign_categories" ("categoryId");

-- 6. 지원자 수 카운트용 인덱스 (성능상 중요)
CREATE INDEX idx_campaign_applications_campaign_id_status ON "campaign_applications" ("campaignId", status, "deletedAt");

-- 7. 사용자 타입별 인덱스
CREATE INDEX IF NOT EXISTS idx_users_type ON "users" (type);