-- 인플루언서 평가 및 페널티 시스템 스키마

-- 인플루언서 평가 테이블
CREATE TABLE IF NOT EXISTS influencer_ratings (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    influencer_id VARCHAR(255) NOT NULL,
    business_id VARCHAR(255) NOT NULL,
    campaign_id VARCHAR(255) NOT NULL,
    
    -- 평가 항목들
    communication_score INT NOT NULL CHECK (communication_score BETWEEN 1 AND 5),
    quality_score INT NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
    timeliness_score INT NOT NULL CHECK (timeliness_score BETWEEN 1 AND 5),
    professionalism_score INT NOT NULL CHECK (professionalism_score BETWEEN 1 AND 5),
    creativity_score INT NOT NULL CHECK (creativity_score BETWEEN 1 AND 5),
    
    -- 종합 평점 (자동 계산)
    overall_score DECIMAL(3,2) GENERATED ALWAYS AS (
        (communication_score + quality_score + timeliness_score + professionalism_score + creativity_score)::DECIMAL / 5.0
    ) STORED,
    
    -- 텍스트 리뷰
    review_text TEXT,
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (influencer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- 중복 평가 방지
    UNIQUE(influencer_id, business_id, campaign_id)
);

-- 페널티 테이블
CREATE TABLE IF NOT EXISTS influencer_penalties (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    influencer_id VARCHAR(255) NOT NULL,
    issued_by VARCHAR(255) NOT NULL, -- 페널티 발급자 (관리자 또는 시스템)
    
    -- 페널티 정보
    penalty_type VARCHAR(50) NOT NULL, -- WARNING, SUSPENSION, BAN
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH
    reason TEXT NOT NULL,
    
    -- 페널티 기간
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP, -- NULL이면 무기한
    
    -- 상태
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, EXPIRED
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255),
    resolution_notes TEXT,
    
    -- 관련 캠페인 (선택적)
    campaign_id VARCHAR(255),
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 외래키
    FOREIGN KEY (influencer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

-- 평가 요약 뷰 (인플루언서별 평균 평점)
CREATE OR REPLACE VIEW influencer_rating_summary AS
SELECT 
    influencer_id,
    COUNT(*) as total_ratings,
    AVG(overall_score) as average_score,
    AVG(communication_score) as avg_communication,
    AVG(quality_score) as avg_quality,
    AVG(timeliness_score) as avg_timeliness,
    AVG(professionalism_score) as avg_professionalism,
    AVG(creativity_score) as avg_creativity,
    MAX(created_at) as last_rated_at
FROM influencer_ratings
GROUP BY influencer_id;

-- 활성 페널티 뷰
CREATE OR REPLACE VIEW active_penalties AS
SELECT 
    ip.*,
    u.name as influencer_name,
    u.email as influencer_email
FROM influencer_penalties ip
JOIN users u ON ip.influencer_id = u.id
WHERE ip.status = 'ACTIVE'
    AND (ip.end_date IS NULL OR ip.end_date > CURRENT_TIMESTAMP);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ratings_influencer ON influencer_ratings(influencer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_business ON influencer_ratings(business_id);
CREATE INDEX IF NOT EXISTS idx_ratings_campaign ON influencer_ratings(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ratings_overall ON influencer_ratings(overall_score);

CREATE INDEX IF NOT EXISTS idx_penalties_influencer ON influencer_penalties(influencer_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON influencer_penalties(status);
CREATE INDEX IF NOT EXISTS idx_penalties_dates ON influencer_penalties(start_date, end_date);