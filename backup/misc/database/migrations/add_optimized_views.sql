-- 캠페인 최적화 Views 생성
-- 복잡한 JOIN 쿼리들을 미리 계산된 View로 대체

-- 1. 캠페인과 비즈니스 정보를 통합한 View
CREATE OR REPLACE VIEW campaign_with_business AS
SELECT 
  c.*,
  u.name as business_name,
  u.email as business_email,
  bp."companyName" as company_name,
  bp."businessNumber" as business_number,
  bp."representativeName" as representative_name,
  bp."businessCategory" as business_category,
  bp."businessAddress" as business_address,
  bp."isVerified" as business_verified
FROM campaigns c
INNER JOIN users u ON c."businessId" = u.id
LEFT JOIN business_profiles bp ON u.id = bp."userId"
WHERE u.type = 'BUSINESS' AND c."deletedAt" IS NULL;

-- 2. 캠페인 통계 정보를 포함한 View  
CREATE OR REPLACE VIEW campaign_with_stats AS
SELECT 
  c.*,
  COALESCE(app_stats.application_count, 0) as application_count,
  COALESCE(app_stats.approved_count, 0) as approved_count,
  COALESCE(content_stats.content_count, 0) as content_count,
  COALESCE(content_stats.approved_content_count, 0) as approved_content_count
FROM campaigns c
LEFT JOIN (
  SELECT 
    ca."campaignId",
    COUNT(*) as application_count,
    COUNT(CASE WHEN ca.status = 'APPROVED' THEN 1 END) as approved_count
  FROM campaign_applications ca
  WHERE ca."deletedAt" IS NULL
  GROUP BY ca."campaignId"
) app_stats ON c.id = app_stats."campaignId"
LEFT JOIN (
  SELECT 
    ca."campaignId",
    COUNT(co.*) as content_count,
    COUNT(CASE WHEN co.status = 'APPROVED' THEN 1 END) as approved_content_count
  FROM campaign_applications ca
  LEFT JOIN contents co ON ca.id = co."applicationId"
  WHERE ca."deletedAt" IS NULL
  GROUP BY ca."campaignId"
) content_stats ON c.id = content_stats."campaignId"
WHERE c."deletedAt" IS NULL;

-- 3. 캠페인과 카테고리 정보를 통합한 View
CREATE OR REPLACE VIEW campaign_with_categories AS
SELECT 
  c.*,
  cat_info.primary_category_id,
  cat_info.primary_category_name,
  cat_info.primary_category_slug,
  cat_info.all_categories,
  cat_info.category_count
FROM campaigns c
LEFT JOIN (
  SELECT 
    cc."campaignId",
    MAX(CASE WHEN cc."isPrimary" = true THEN cat.id END) as primary_category_id,
    MAX(CASE WHEN cc."isPrimary" = true THEN cat.name END) as primary_category_name,
    MAX(CASE WHEN cc."isPrimary" = true THEN cat.slug END) as primary_category_slug,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', cat.id,
        'name', cat.name,
        'slug', cat.slug,
        'isPrimary', cc."isPrimary"
      )
    ) as all_categories,
    COUNT(*) as category_count
  FROM campaign_categories cc
  INNER JOIN categories cat ON cc."categoryId" = cat.id
  WHERE cat."isActive" = true
  GROUP BY cc."campaignId"
) cat_info ON c.id = cat_info."campaignId"
WHERE c."deletedAt" IS NULL;

-- 4. 완전한 캠페인 정보 View (가장 자주 사용되는 JOIN 패턴)
CREATE OR REPLACE VIEW campaign_complete AS
SELECT 
  c.id,
  c."businessId",
  c.title,
  c.description,
  c.platform,
  c.budget,
  c."targetFollowers",
  c."startDate",
  c."endDate",
  c.requirements,
  c.hashtags,
  c."imageUrl",
  c."imageId",
  c."headerImageUrl",
  c."thumbnailImageUrl",
  c."productImages",
  c.status,
  c."isPaid",
  c."maxApplicants",
  c."rewardAmount",
  c.location,
  c."viewCount",
  c."createdAt",
  c."updatedAt",
  c."budgetType",
  c."isPublished",
  c."campaignType",
  
  -- 비즈니스 정보
  u.name as business_name,
  u.email as business_email,
  bp."companyName" as company_name,
  bp."businessCategory" as business_category,
  bp."isVerified" as business_verified,
  
  -- 카테고리 정보
  cat_info.primary_category_name,
  cat_info.primary_category_slug,
  cat_info.all_categories,
  
  -- 통계 정보
  COALESCE(stats.application_count, 0) as application_count,
  COALESCE(stats.approved_count, 0) as approved_count,
  
  -- 계산된 필드
  CASE 
    WHEN c."endDate" < NOW() THEN 'EXPIRED'
    WHEN c."startDate" > NOW() THEN 'UPCOMING'
    ELSE c.status
  END as computed_status,
  
  EXTRACT(EPOCH FROM (c."endDate" - NOW())) / 86400 as days_remaining,
  
  CASE 
    WHEN c.budget IS NOT NULL AND c.budget > 0 THEN c.budget
    WHEN c."rewardAmount" IS NOT NULL AND c."rewardAmount" > 0 THEN c."rewardAmount"
    ELSE 0
  END as effective_budget

FROM campaigns c
INNER JOIN users u ON c."businessId" = u.id
LEFT JOIN business_profiles bp ON u.id = bp."userId"
LEFT JOIN (
  SELECT 
    cc."campaignId",
    MAX(CASE WHEN cc."isPrimary" = true THEN cat.name END) as primary_category_name,
    MAX(CASE WHEN cc."isPrimary" = true THEN cat.slug END) as primary_category_slug,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', cat.id,
        'name', cat.name,
        'slug', cat.slug,
        'isPrimary', cc."isPrimary"
      )
    ) as all_categories
  FROM campaign_categories cc
  INNER JOIN categories cat ON cc."categoryId" = cat.id
  WHERE cat."isActive" = true
  GROUP BY cc."campaignId"
) cat_info ON c.id = cat_info."campaignId"
LEFT JOIN (
  SELECT 
    ca."campaignId",
    COUNT(*) as application_count,
    COUNT(CASE WHEN ca.status = 'APPROVED' THEN 1 END) as approved_count
  FROM campaign_applications ca
  WHERE ca."deletedAt" IS NULL
  GROUP BY ca."campaignId"
) stats ON c.id = stats."campaignId"
WHERE c."deletedAt" IS NULL AND u.type = 'BUSINESS';

-- 5. 사용자 프로필 통합 View
CREATE OR REPLACE VIEW user_complete AS
SELECT 
  u.*,
  
  -- 인플루언서 프로필
  p.bio as influencer_bio,
  p."profileImage" as influencer_profile_image,
  p.phone as influencer_phone,
  p."birthYear" as influencer_birth_year,
  p.gender as influencer_gender,
  p.instagram as influencer_instagram,
  p."instagramFollowers" as influencer_instagram_followers,
  p.youtube as influencer_youtube,
  p."youtubeSubscribers" as influencer_youtube_subscribers,
  p.categories as influencer_categories,
  p."isVerified" as influencer_verified,
  p."followerCount" as influencer_total_followers,
  
  -- 비즈니스 프로필
  bp."companyName" as business_company_name,
  bp."businessNumber" as business_number,
  bp."representativeName" as business_representative,
  bp."businessAddress" as business_address,
  bp."businessCategory" as business_category,
  bp."isVerified" as business_verified,
  
  -- 계산된 필드
  CASE 
    WHEN u.type = 'INFLUENCER' AND p."isVerified" = true THEN 'VERIFIED_INFLUENCER'
    WHEN u.type = 'BUSINESS' AND bp."isVerified" = true THEN 'VERIFIED_BUSINESS'
    WHEN u.type = 'ADMIN' THEN 'ADMIN'
    ELSE u.type
  END as user_status,
  
  COALESCE(p."profileCompleted", false) OR COALESCE(bp."isVerified", false) as profile_complete

FROM users u
LEFT JOIN profiles p ON u.id = p."userId"
LEFT JOIN business_profiles bp ON u.id = bp."userId"
WHERE u."deletedAt" IS NULL;

-- 6. 관리자 대시보드 통계 View (실시간 계산 최적화)
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  -- 사용자 통계
  (SELECT COUNT(*) FROM users WHERE "deletedAt" IS NULL) as total_users,
  (SELECT COUNT(*) FROM users WHERE "deletedAt" IS NULL AND type = 'BUSINESS') as total_businesses,
  (SELECT COUNT(*) FROM users WHERE "deletedAt" IS NULL AND type = 'INFLUENCER') as total_influencers,
  (SELECT COUNT(*) FROM users WHERE "deletedAt" IS NULL AND "lastLogin" >= NOW() - INTERVAL '7 days') as active_users,
  (SELECT COUNT(*) FROM users WHERE "deletedAt" IS NULL AND "createdAt" >= CURRENT_DATE) as new_users_today,
  
  -- 캠페인 통계
  (SELECT COUNT(*) FROM campaigns WHERE "deletedAt" IS NULL) as total_campaigns,
  (SELECT COUNT(*) FROM campaigns WHERE "deletedAt" IS NULL AND status = 'ACTIVE') as active_campaigns,
  (SELECT COUNT(*) FROM campaigns WHERE "deletedAt" IS NULL AND status = 'DRAFT') as draft_campaigns,
  (SELECT COUNT(*) FROM campaigns WHERE "deletedAt" IS NULL AND status = 'COMPLETED') as completed_campaigns,
  (SELECT COUNT(*) FROM campaigns WHERE "deletedAt" IS NULL AND "createdAt" >= CURRENT_DATE) as new_campaigns_today,
  
  -- 지원서 통계
  (SELECT COUNT(*) FROM campaign_applications WHERE "deletedAt" IS NULL) as total_applications,
  (SELECT COUNT(*) FROM campaign_applications WHERE "deletedAt" IS NULL AND status = 'PENDING') as pending_applications,
  (SELECT COUNT(*) FROM campaign_applications WHERE "deletedAt" IS NULL AND status = 'APPROVED') as approved_applications,
  (SELECT COUNT(*) FROM campaign_applications WHERE "deletedAt" IS NULL AND "createdAt" >= CURRENT_DATE) as new_applications_today,
  
  -- 결제 통계
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'COMPLETED') as total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'COMPLETED' AND "createdAt" >= CURRENT_DATE) as revenue_today,
  (SELECT COUNT(*) FROM payments WHERE status = 'PENDING') as pending_payments,
  
  -- 승인 대기
  (SELECT COUNT(*) FROM business_profiles WHERE "isVerified" = false) as pending_business_approvals,
  (SELECT COUNT(*) FROM profiles WHERE "isVerified" = false) as pending_influencer_approvals;

-- 인덱스 생성 (Views의 성능 향상을 위해)
CREATE INDEX IF NOT EXISTS idx_campaigns_business_status ON campaigns ("businessId", status) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status_created ON campaign_applications (status, "createdAt") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_type_created ON users (type, "createdAt") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users ("lastLogin") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status_amount ON payments (status, amount);
CREATE INDEX IF NOT EXISTS idx_business_profiles_verified ON business_profiles ("isVerified");
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles ("isVerified");

-- View에 대한 코멘트 추가
COMMENT ON VIEW campaign_with_business IS '캠페인과 비즈니스 정보가 미리 JOIN된 최적화 View';
COMMENT ON VIEW campaign_with_stats IS '캠페인 통계 정보가 포함된 View';
COMMENT ON VIEW campaign_with_categories IS '캠페인과 카테고리 정보가 통합된 View';
COMMENT ON VIEW campaign_complete IS '가장 자주 사용되는 캠페인 완전 정보 View';
COMMENT ON VIEW user_complete IS '사용자 프로필이 통합된 View';
COMMENT ON VIEW admin_dashboard_stats IS '관리자 대시보드 실시간 통계 View';