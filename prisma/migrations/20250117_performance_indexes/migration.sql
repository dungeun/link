-- 성능 최적화를 위한 인덱스 추가

-- campaigns 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_end_date ON campaigns(start_date, end_date);

-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- campaign_applications 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_influencer_id ON campaign_applications(influencer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON campaign_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON campaign_applications(created_at DESC);

-- influencer_penalties 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_penalties_influencer_id ON influencer_penalties(influencer_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON influencer_penalties(status);
CREATE INDEX IF NOT EXISTS idx_penalties_end_date ON influencer_penalties(end_date);

-- influencer_ratings 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ratings_influencer_id ON influencer_ratings(influencer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_business_id ON influencer_ratings(business_id);
CREATE INDEX IF NOT EXISTS idx_ratings_campaign_id ON influencer_ratings(campaign_id);

-- language_packs 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_language_packs_key ON language_packs(key);
CREATE INDEX IF NOT EXISTS idx_language_packs_category ON language_packs(category);

-- ui_sections 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_ui_sections_type ON ui_sections(type);
CREATE INDEX IF NOT EXISTS idx_ui_sections_visible ON ui_sections(visible);
CREATE INDEX IF NOT EXISTS idx_ui_sections_order ON ui_sections("order");

-- 복합 인덱스 (자주 함께 사용되는 컬럼)
CREATE INDEX IF NOT EXISTS idx_campaigns_status_category ON campaigns(status, category);
CREATE INDEX IF NOT EXISTS idx_applications_campaign_status ON campaign_applications(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_penalties_influencer_status ON influencer_penalties(influencer_id, status);