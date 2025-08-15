-- 성능 최적화를 위한 인덱스 추가

-- Campaign 테이블 인덱스
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "campaigns"("status");
CREATE INDEX IF NOT EXISTS "Campaign_businessId_idx" ON "campaigns"("businessId");
CREATE INDEX IF NOT EXISTS "Campaign_createdAt_idx" ON "campaigns"("createdAt");
CREATE INDEX IF NOT EXISTS "Campaign_endDate_idx" ON "campaigns"("endDate");
CREATE INDEX IF NOT EXISTS "Campaign_category_idx" ON "campaigns"("category");

-- CampaignApplication 테이블 인덱스
CREATE INDEX IF NOT EXISTS "CampaignApplication_status_idx" ON "campaign_applications"("status");
CREATE INDEX IF NOT EXISTS "CampaignApplication_createdAt_idx" ON "campaign_applications"("createdAt");
CREATE INDEX IF NOT EXISTS "CampaignApplication_campaignId_idx" ON "campaign_applications"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignApplication_influencerId_idx" ON "campaign_applications"("influencerId");

-- User 테이블 인덱스
CREATE INDEX IF NOT EXISTS "User_type_idx" ON "users"("type");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "users"("status");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "users"("createdAt");

-- Settlement 테이블 인덱스
CREATE INDEX IF NOT EXISTS "Settlement_status_idx" ON "settlements"("status");
CREATE INDEX IF NOT EXISTS "Settlement_userId_idx" ON "settlements"("userId");
CREATE INDEX IF NOT EXISTS "Settlement_createdAt_idx" ON "settlements"("createdAt");
CREATE INDEX IF NOT EXISTS "Settlement_periodStart_idx" ON "settlements"("periodStart");

-- Payment 테이블 인덱스
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "payments"("userId");
CREATE INDEX IF NOT EXISTS "Payment_campaignId_idx" ON "payments"("campaignId");
CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "payments"("createdAt");

-- Post 테이블 인덱스
CREATE INDEX IF NOT EXISTS "Post_boardId_idx" ON "posts"("boardId");
CREATE INDEX IF NOT EXISTS "Post_status_idx" ON "posts"("status");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "posts"("createdAt");

-- Comment 테이블 인덱스
CREATE INDEX IF NOT EXISTS "Comment_postId_idx" ON "comments"("postId");
CREATE INDEX IF NOT EXISTS "Comment_userId_idx" ON "comments"("userId");
CREATE INDEX IF NOT EXISTS "Comment_createdAt_idx" ON "comments"("createdAt");

-- Notification 테이블 인덱스
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "notifications"("createdAt");

-- 복합 인덱스 (자주 함께 사용되는 컬럼들)
CREATE INDEX IF NOT EXISTS "Campaign_status_businessId_idx" ON "campaigns"("status", "businessId");
CREATE INDEX IF NOT EXISTS "CampaignApplication_campaignId_status_idx" ON "campaign_applications"("campaignId", "status");
CREATE INDEX IF NOT EXISTS "Settlement_userId_status_idx" ON "settlements"("userId", "status");
CREATE INDEX IF NOT EXISTS "Payment_campaignId_status_idx" ON "payments"("campaignId", "status");

-- 통계 업데이트
ANALYZE;