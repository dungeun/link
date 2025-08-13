-- 캠페인 다중 카테고리 지원을 위한 스키마 업데이트
-- 메인 카테고리와 서브 카테고리들을 분리하여 저장

-- campaigns 테이블에 새로운 컬럼 추가
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS main_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS sub_categories JSON,
ADD COLUMN IF NOT EXISTS category VARCHAR(50); -- 기존 호환성 유지

-- 기존 데이터 마이그레이션 (category -> main_category)
UPDATE campaigns 
SET main_category = COALESCE(category, 'lifestyle')
WHERE main_category IS NULL;

-- 카테고리 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_campaigns_main_category ON campaigns(main_category);

-- JSON 인덱스 (PostgreSQL GIN 인덱스)
CREATE INDEX IF NOT EXISTS idx_campaigns_sub_categories ON campaigns USING GIN(sub_categories);

-- 사용 가능한 카테고리 목록 (참조용 코멘트)
COMMENT ON COLUMN campaigns.main_category IS '메인 카테고리: beauty, fashion, food, travel, tech, fitness, lifestyle, pet, parenting, game, education, facebook';
COMMENT ON COLUMN campaigns.sub_categories IS '서브 카테고리 배열 (JSON): ["beauty", "fashion", "food"] 등';