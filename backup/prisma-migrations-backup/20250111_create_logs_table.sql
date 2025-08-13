-- 로그 테이블은 이미 Prisma로 생성됨
-- 추가 인덱스만 생성 (Prisma에서 생성하지 않은 것들)

-- 조건부 인덱스 생성 (NULL이 아닌 값들만 인덱싱)
CREATE INDEX IF NOT EXISTS idx_logs_userId_not_null ON logs("userId") WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_requestId_not_null ON logs("requestId") WHERE "requestId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_logs_component_not_null ON logs(component) WHERE component IS NOT NULL;

-- 파티셔닝을 위한 준비 (월별 파티션)
-- 30일 이상 된 로그 자동 삭제를 위한 정책
CREATE OR REPLACE FUNCTION delete_old_logs() RETURNS void AS $$
BEGIN
  DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 매일 실행되는 크론 작업 (Supabase에서 pg_cron 설정 필요)
-- SELECT cron.schedule('delete-old-logs', '0 2 * * *', 'SELECT delete_old_logs();');