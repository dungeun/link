-- 어드민 페이지 성능 최적화를 위한 인덱스 추가
-- 실행: npx prisma db execute --file prisma/optimize-indexes.sql

-- Campaign 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_status ON "Campaign"(status);
CREATE INDEX IF NOT EXISTS idx_campaign_main_category ON "Campaign"("mainCategory");
CREATE INDEX IF NOT EXISTS idx_campaign_created_at ON "Campaign"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_business_id ON "Campaign"("businessId");
CREATE INDEX IF NOT EXISTS idx_campaign_deleted_at ON "Campaign"("deletedAt");
CREATE INDEX IF NOT EXISTS idx_campaign_composite_filter ON "Campaign"(status, "mainCategory", "deletedAt", "createdAt" DESC);

-- User 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_type ON "User"(type);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "User"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_user_last_login ON "User"("lastLogin" DESC);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- Payment 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"(status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON "Payment"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_payment_campaign_id ON "Payment"("campaignId");
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS idx_payment_composite ON "Payment"(status, "createdAt" DESC);

-- CampaignApplication 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_application_status ON "CampaignApplication"(status);
CREATE INDEX IF NOT EXISTS idx_application_campaign_id ON "CampaignApplication"("campaignId");
CREATE INDEX IF NOT EXISTS idx_application_influencer_id ON "CampaignApplication"("influencerId");
CREATE INDEX IF NOT EXISTS idx_application_created_at ON "CampaignApplication"("createdAt" DESC);

-- BusinessProfile 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_business_profile_user_id ON "BusinessProfile"("userId");
CREATE INDEX IF NOT EXISTS idx_business_profile_verified ON "BusinessProfile"("isVerified");

-- Profile (Influencer) 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_profile_user_id ON "Profile"("userId");
CREATE INDEX IF NOT EXISTS idx_profile_verified ON "Profile"("isVerified");

-- Settlement 테이블 인덱스 (if exists)
CREATE INDEX IF NOT EXISTS idx_settlement_status ON "Settlement"(status);
CREATE INDEX IF NOT EXISTS idx_settlement_created_at ON "Settlement"("createdAt" DESC);

-- 통계 분석을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_campaign_stats ON "Campaign"(status, "createdAt", "budget");
CREATE INDEX IF NOT EXISTS idx_user_stats ON "User"(type, "createdAt");
CREATE INDEX IF NOT EXISTS idx_payment_stats ON "Payment"(status, "createdAt", amount);

-- 분석 완료
-- 이 스크립트 실행 후 데이터베이스를 ANALYZE하여 통계 업데이트
ANALYZE;