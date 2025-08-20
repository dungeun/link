-- 데이터베이스 최적화 SQL 스크립트
-- 실행 전 백업 권장

-- ========================================
-- 1. VACUUM 및 ANALYZE 실행 (dead rows 정리)
-- ========================================

VACUUM ANALYZE campaign_translations;  -- 28.85% dead
VACUUM ANALYZE users;                  -- 228.57% dead
VACUUM ANALYZE categories;             -- 80.00% dead
VACUUM ANALYZE payments;               -- 255.56% dead
VACUUM ANALYZE campaign_categories;   -- 72.22% dead

-- 전체 데이터베이스 최적화
VACUUM ANALYZE;

-- ========================================
-- 2. 새 인덱스 생성 (누락된 핵심 인덱스)
-- ========================================

-- 캠페인별 지원 현황 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_campaign_status_deleted
ON applications (campaign_id, status, deleted_at)
WHERE deleted_at IS NULL;

-- 언어팩 빠른 조회를 위한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_language_packs_key_lang
ON language_packs (key, ko, en, jp);

-- 프로필 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id_type
ON profiles (user_id)
WHERE deleted_at IS NULL;

-- ========================================
-- 3. 사용되지 않는 인덱스 삭제 (메모리 절약)
-- ========================================

-- 주의: 실제 프로덕션에서는 신중하게 검토 후 삭제
-- 여기서는 명확히 중복되거나 사용되지 않는 것만 삭제

-- 중복 인덱스 삭제 (더 나은 인덱스가 이미 존재)
DROP INDEX CONCURRENTLY IF EXISTS idx_campaigns_created_date_trunc;  -- campaigns_createdAt_idx가 있음
DROP INDEX CONCURRENTLY IF EXISTS idx_campaigns_location_status;     -- 사용 안됨
DROP INDEX CONCURRENTLY IF EXISTS idx_campaigns_platforms_gin;       -- platform 컬럼 사용
DROP INDEX CONCURRENTLY IF EXISTS idx_campaigns_status_budget_desc;  -- 사용 안됨
DROP INDEX CONCURRENTLY IF EXISTS idx_campaigns_status_enddate_asc;  -- 사용 안됨

-- 사용되지 않는 users 인덱스 정리
DROP INDEX CONCURRENTLY IF EXISTS idx_users_created_date_trunc;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_last_login;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_name_email_fts;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_recent_activity;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_type_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_type_lastlogin;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_type_status_created;

-- 사용되지 않는 campaign_applications 인덱스 정리
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_campaign_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_created_date_trunc;
DROP INDEX CONCURRENTLY IF EXISTS idx_applications_recent_activity;

-- ========================================
-- 4. 통계 업데이트 (쿼리 플래너 최적화)
-- ========================================

-- 자주 조회되는 테이블의 통계 정확도 향상
ALTER TABLE campaigns SET (autovacuum_analyze_scale_factor = 0.01);
ALTER TABLE language_packs SET (autovacuum_analyze_scale_factor = 0.01);
ALTER TABLE applications SET (autovacuum_analyze_scale_factor = 0.01);
ALTER TABLE profiles SET (autovacuum_analyze_scale_factor = 0.01);

-- 통계 수집 대상 샘플 증가 (더 정확한 쿼리 계획)
ALTER TABLE campaigns SET STATISTICS 1000;
ALTER TABLE language_packs SET STATISTICS 1000;

-- ========================================
-- 5. 연결 풀링 및 성능 파라미터 (참고용)
-- ========================================

-- 이 설정들은 postgresql.conf 또는 Supabase 대시보드에서 조정
-- shared_buffers = 256MB         -- 캐시 메모리
-- effective_cache_size = 1GB     -- OS 캐시 포함 전체 캐시
-- work_mem = 4MB                 -- 정렬/해시 작업용 메모리
-- maintenance_work_mem = 64MB    -- VACUUM, CREATE INDEX용
-- random_page_cost = 1.1         -- SSD 환경 최적화
-- max_connections = 100          -- 연결 풀 사용 권장

-- ========================================
-- 6. 캐시 워밍 (자주 사용되는 데이터 미리 로드)
-- ========================================

-- pg_prewarm 확장 활성화 (Supabase에서 이미 활성화되어 있을 수 있음)
-- CREATE EXTENSION IF NOT EXISTS pg_prewarm;

-- 자주 조회되는 테이블 캐시 로드
-- SELECT pg_prewarm('campaigns');
-- SELECT pg_prewarm('language_packs');
-- SELECT pg_prewarm('profiles');

-- ========================================
-- 7. 파티셔닝 고려 (대용량 테이블용 - 향후)
-- ========================================

-- 로그 테이블이 커지면 월별 파티셔닝 고려
-- CREATE TABLE logs_2024_01 PARTITION OF logs 
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ========================================
-- 실행 후 확인 명령어
-- ========================================

-- 인덱스 사용 통계 확인
-- SELECT * FROM pg_stat_user_indexes WHERE idx_scan > 0 ORDER BY idx_scan DESC;

-- 테이블 통계 확인
-- SELECT * FROM pg_stat_user_tables ORDER BY n_live_tup DESC;

-- 느린 쿼리 확인
-- SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;