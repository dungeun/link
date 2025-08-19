-- 어드민 페이지 성능 최적화를 위한 인덱스 추가
-- Note: Production에서는 CREATE INDEX CONCURRENTLY를 사용하세요

-- User 테이블 인덱스
CREATE INDEX IF NOT EXISTS "idx_user_last_login" ON "User"("lastLogin" DESC);
CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "User"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_user_type" ON "User"("type");
CREATE INDEX IF NOT EXISTS "idx_user_type_created" ON "User"("type", "createdAt" DESC);

-- Campaign 테이블 인덱스
CREATE INDEX IF NOT EXISTS "idx_campaign_status" ON "Campaign"("status");
CREATE INDEX IF NOT EXISTS "idx_campaign_created_at" ON "Campaign"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_campaign_status_created" ON "Campaign"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_campaign_business_id" ON "Campaign"("businessId");
CREATE INDEX IF NOT EXISTS "idx_campaign_main_category" ON "Campaign"("mainCategory");
CREATE INDEX IF NOT EXISTS "idx_campaign_category" ON "Campaign"("category");

-- Payment 테이블 인덱스
CREATE INDEX IF NOT EXISTS "idx_payment_status" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "idx_payment_created_at" ON "Payment"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_payment_status_created" ON "Payment"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_payment_campaign_id" ON "Payment"("campaignId");
CREATE INDEX IF NOT EXISTS "idx_payment_user_id" ON "Payment"("userId");

-- CampaignApplication 테이블 인덱스
CREATE INDEX IF NOT EXISTS "idx_application_created_at" ON "CampaignApplication"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_application_status" ON "CampaignApplication"("status");
CREATE INDEX IF NOT EXISTS "idx_application_campaign_id" ON "CampaignApplication"("campaignId");
CREATE INDEX IF NOT EXISTS "idx_application_influencer_id" ON "CampaignApplication"("influencerId");

-- Profile 테이블 인덱스
CREATE INDEX IF NOT EXISTS "idx_profile_is_verified" ON "Profile"("isVerified");
CREATE INDEX IF NOT EXISTS "idx_profile_created_at" ON "Profile"("createdAt" DESC);

-- BusinessProfile 테이블 인덱스
CREATE INDEX IF NOT EXISTS "idx_business_profile_is_verified" ON "BusinessProfile"("isVerified");
CREATE INDEX IF NOT EXISTS "idx_business_profile_created_at" ON "BusinessProfile"("createdAt" DESC);

-- Settlement 테이블 인덱스
CREATE INDEX IF NOT EXISTS "idx_settlement_status" ON "Settlement"("status");
CREATE INDEX IF NOT EXISTS "idx_settlement_created_at" ON "Settlement"("createdAt" DESC);

-- 복합 인덱스 (자주 함께 사용되는 필드)
CREATE INDEX IF NOT EXISTS "idx_user_type_last_login" ON "User"("type", "lastLogin" DESC);
CREATE INDEX IF NOT EXISTS "idx_campaign_status_start_end" ON "Campaign"("status", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "idx_payment_status_amount" ON "Payment"("status", "amount");