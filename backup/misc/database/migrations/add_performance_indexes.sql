-- 성능 최적화를 위한 추가 복합 인덱스 생성

-- 1. 캠페인 목록 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created_business 
ON campaigns (status, "createdAt" DESC, "businessId") 
WHERE "deletedAt" IS NULL;

-- 2. 캠페인 필터링 최적화 인덱스 (플랫폼 + 상태)
CREATE INDEX IF NOT EXISTS idx_campaigns_platform_status_created 
ON campaigns (platform, status, "createdAt" DESC) 
WHERE "deletedAt" IS NULL;

-- 3. 캠페인 예산/보상 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_campaigns_status_budget_desc 
ON campaigns (status, budget DESC NULLS LAST) 
WHERE "deletedAt" IS NULL AND budget IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_status_reward_desc 
ON campaigns (status, "rewardAmount" DESC) 
WHERE "deletedAt" IS NULL;

-- 4. 캠페인 마감일 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_campaigns_status_enddate_asc 
ON campaigns (status, "endDate" ASC) 
WHERE "deletedAt" IS NULL;

-- 5. 캠페인 카테고리 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_campaign_categories_category_campaign 
ON campaign_categories ("categoryId", "campaignId", "isPrimary");

-- 6. 캠페인 지원서 통계 최적화
CREATE INDEX IF NOT EXISTS idx_applications_campaign_status_created 
ON campaign_applications ("campaignId", status, "createdAt") 
WHERE "deletedAt" IS NULL;

-- 7. 사용자 타입별 조회 최적화 
CREATE INDEX IF NOT EXISTS idx_users_type_status_created 
ON users (type, status, "createdAt" DESC) 
WHERE "deletedAt" IS NULL;

-- 8. 사용자 로그인 활동 최적화
CREATE INDEX IF NOT EXISTS idx_users_type_lastlogin 
ON users (type, "lastLogin" DESC) 
WHERE "deletedAt" IS NULL AND "lastLogin" IS NOT NULL;

-- 9. 비즈니스 프로필 검증 상태 최적화
CREATE INDEX IF NOT EXISTS idx_business_profiles_verified_created 
ON business_profiles ("isVerified", "createdAt" DESC);

-- 10. 인플루언서 프로필 검증 상태 최적화
CREATE INDEX IF NOT EXISTS idx_profiles_verified_created 
ON profiles ("isVerified", "createdAt" DESC);

-- 11. 결제 통계 최적화
CREATE INDEX IF NOT EXISTS idx_payments_status_created_amount 
ON payments (status, "createdAt" DESC, amount) 
WHERE status IN ('COMPLETED', 'PENDING');

-- 12. 정산 관련 최적화
CREATE INDEX IF NOT EXISTS idx_settlements_influencer_status_created 
ON settlements ("influencerId", status, "createdAt" DESC);

-- 13. 알림 조회 최적화 
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_read 
ON notifications ("userId", "createdAt" DESC, "readAt");

-- 14. 파일 업로드 최적화
CREATE INDEX IF NOT EXISTS idx_files_user_type_created 
ON files ("userId", type, "createdAt" DESC);

-- 15. 카테고리 활성 상태 최적화
CREATE INDEX IF NOT EXISTS idx_categories_active_menu_order 
ON categories ("isActive", "showInMenu", "menuOrder", "order");

-- 16. 로그 조회 최적화 (관리자용)
CREATE INDEX IF NOT EXISTS idx_logs_level_created_user 
ON logs (level, "createdAt" DESC, "userId");

-- 17. JSON 필드 검색 최적화 (GIN 인덱스)
CREATE INDEX IF NOT EXISTS idx_campaigns_hashtags_gin 
ON campaigns USING GIN (hashtags jsonb_path_ops) 
WHERE hashtags IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_platforms_gin 
ON campaigns USING GIN (platforms jsonb_path_ops) 
WHERE platforms IS NOT NULL;

-- 18. 텍스트 검색 최적화 (Full Text Search)
CREATE INDEX IF NOT EXISTS idx_campaigns_title_description_fts 
ON campaigns USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_users_name_email_fts 
ON users USING GIN (to_tsvector('english', name || ' ' || email));

-- 19. 지리적 검색 최적화 (위치 기반)
CREATE INDEX IF NOT EXISTS idx_campaigns_location_status 
ON campaigns (location, status) 
WHERE "deletedAt" IS NULL AND location IS NOT NULL;

-- 20. 시간대별 분석 최적화 (날짜 파티셔닝 대용)
CREATE INDEX IF NOT EXISTS idx_campaigns_created_date_trunc 
ON campaigns (DATE_TRUNC('day', "createdAt"), status) 
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_created_date_trunc 
ON users (DATE_TRUNC('day', "createdAt"), type) 
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_applications_created_date_trunc 
ON campaign_applications (DATE_TRUNC('day', "createdAt"), status) 
WHERE "deletedAt" IS NULL;

-- 21. 복합 비즈니스 로직 최적화
-- 활성 캠페인 조회용
CREATE INDEX IF NOT EXISTS idx_campaigns_active_applications 
ON campaigns (status, "applicationEndDate", "maxApplicants", "createdAt" DESC) 
WHERE "deletedAt" IS NULL AND status = 'ACTIVE';

-- 22. 관리자 대시보드 최적화
-- 최근 활동 조회용 개별 인덱스들
CREATE INDEX IF NOT EXISTS idx_users_recent_activity 
ON users ("createdAt" DESC, type) 
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_recent_activity 
ON campaigns ("createdAt" DESC, status) 
WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_applications_recent_activity 
ON campaign_applications ("createdAt" DESC, status) 
WHERE "deletedAt" IS NULL;

-- 성능 분석을 위한 통계 정보 업데이트
ANALYZE campaigns;
ANALYZE users;
ANALYZE campaign_applications;
ANALYZE business_profiles;
ANALYZE profiles;
ANALYZE payments;
ANALYZE campaign_categories;
ANALYZE categories;

-- 간단한 인덱스 사용률 모니터링 View 생성
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  relname as table_name,
  indexrelname as index_name,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 10 THEN 'LOW_USAGE' 
    WHEN idx_scan < 100 THEN 'MEDIUM_USAGE'
    ELSE 'HIGH_USAGE'
  END as usage_level
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 코멘트 추가
COMMENT ON INDEX idx_campaigns_status_created_business IS '캠페인 목록 조회 최적화 (상태 + 생성일 + 비즈니스)';
COMMENT ON INDEX idx_campaigns_platform_status_created IS '플랫폼별 캠페인 필터링 최적화';
COMMENT ON INDEX idx_campaigns_title_description_fts IS '캠페인 제목/설명 전문 검색 최적화';
COMMENT ON VIEW index_usage_stats IS '인덱스 사용률 모니터링 View';