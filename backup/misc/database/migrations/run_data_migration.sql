-- 기존 JSON 데이터를 정규화된 테이블로 마이그레이션

-- 해시태그 마이그레이션 실행
SELECT migrate_campaign_hashtags();

-- 플랫폼 마이그레이션 실행  
SELECT migrate_campaign_platforms();

-- 이미지 마이그레이션 실행
SELECT migrate_campaign_images();

-- 키워드 마이그레이션 실행
SELECT migrate_campaign_keywords();

-- 마이그레이션 결과 확인
SELECT 
  'campaign_hashtags' as table_name,
  COUNT(*) as record_count
FROM campaign_hashtags
UNION ALL
SELECT 
  'campaign_platforms' as table_name,
  COUNT(*) as record_count  
FROM campaign_platforms
UNION ALL
SELECT 
  'campaign_images' as table_name,
  COUNT(*) as record_count
FROM campaign_images
UNION ALL
SELECT 
  'campaign_keywords' as table_name,
  COUNT(*) as record_count
FROM campaign_keywords;