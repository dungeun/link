-- JSON 필드들을 정규화된 테이블로 이관

-- 1. 캠페인 해시태그 테이블 생성
CREATE TABLE IF NOT EXISTS "campaign_hashtags" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "hashtag" TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "campaign_hashtags_pkey" PRIMARY KEY ("id")
);

-- 2. 캠페인 플랫폼 테이블 생성 (campaigns.platforms JSON 대체)
CREATE TABLE IF NOT EXISTS "campaign_platforms" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "campaign_platforms_pkey" PRIMARY KEY ("id")
);

-- 3. 캠페인 이미지 테이블 생성 (detailImages, productImages JSON 대체)
CREATE TABLE IF NOT EXISTS "campaign_images" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "imageId" TEXT,
  "type" TEXT NOT NULL, -- 'DETAIL', 'PRODUCT', 'HEADER', 'THUMBNAIL'
  "order" INTEGER DEFAULT 0,
  "alt" TEXT,
  "caption" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "campaign_images_pkey" PRIMARY KEY ("id")
);

-- 4. 캠페인 키워드 테이블 생성
CREATE TABLE IF NOT EXISTS "campaign_keywords" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "weight" INTEGER DEFAULT 1, -- 키워드 가중치
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "campaign_keywords_pkey" PRIMARY KEY ("id")
);

-- 5. 캠페인 질문 테이블 생성 (questions JSON 대체)
CREATE TABLE IF NOT EXISTS "campaign_questions" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'TEXT', -- 'TEXT', 'MULTIPLE_CHOICE', 'BOOLEAN', 'NUMBER'
  "required" BOOLEAN NOT NULL DEFAULT false,
  "options" JSONB, -- 선택형 질문의 옵션들
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "campaign_questions_pkey" PRIMARY KEY ("id")
);

-- 6. 외래키 제약조건 추가
ALTER TABLE "campaign_hashtags" ADD CONSTRAINT "campaign_hashtags_campaignId_fkey" 
FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_platforms" ADD CONSTRAINT "campaign_platforms_campaignId_fkey" 
FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_images" ADD CONSTRAINT "campaign_images_campaignId_fkey" 
FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_keywords" ADD CONSTRAINT "campaign_keywords_campaignId_fkey" 
FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_questions" ADD CONSTRAINT "campaign_questions_campaignId_fkey" 
FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. 유니크 제약조건 추가
ALTER TABLE "campaign_hashtags" ADD CONSTRAINT "campaign_hashtags_campaignId_hashtag_key" 
UNIQUE ("campaignId", "hashtag");

ALTER TABLE "campaign_platforms" ADD CONSTRAINT "campaign_platforms_campaignId_platform_key" 
UNIQUE ("campaignId", "platform");

ALTER TABLE "campaign_keywords" ADD CONSTRAINT "campaign_keywords_campaignId_keyword_key" 
UNIQUE ("campaignId", "keyword");

-- 8. 인덱스 생성
CREATE INDEX "idx_campaign_hashtags_campaign_id" ON "campaign_hashtags"("campaignId");
CREATE INDEX "idx_campaign_hashtags_hashtag" ON "campaign_hashtags"("hashtag");

CREATE INDEX "idx_campaign_platforms_campaign_id" ON "campaign_platforms"("campaignId");
CREATE INDEX "idx_campaign_platforms_platform" ON "campaign_platforms"("platform");
CREATE INDEX "idx_campaign_platforms_primary" ON "campaign_platforms"("campaignId", "isPrimary");

CREATE INDEX "idx_campaign_images_campaign_id" ON "campaign_images"("campaignId");
CREATE INDEX "idx_campaign_images_type" ON "campaign_images"("type");
CREATE INDEX "idx_campaign_images_campaign_type" ON "campaign_images"("campaignId", "type");

CREATE INDEX "idx_campaign_keywords_campaign_id" ON "campaign_keywords"("campaignId");
CREATE INDEX "idx_campaign_keywords_keyword" ON "campaign_keywords"("keyword");

CREATE INDEX "idx_campaign_questions_campaign_id" ON "campaign_questions"("campaignId");
CREATE INDEX "idx_campaign_questions_order" ON "campaign_questions"("campaignId", "order");

-- 9. 기존 데이터 마이그레이션을 위한 함수들

-- 해시태그 마이그레이션 함수
CREATE OR REPLACE FUNCTION migrate_campaign_hashtags() RETURNS void AS $$
DECLARE
    campaign_record RECORD;
    hashtag_item TEXT;
    hashtag_array TEXT[];
    counter INTEGER;
BEGIN
    FOR campaign_record IN 
        SELECT id, hashtags FROM campaigns 
        WHERE hashtags IS NOT NULL AND hashtags != 'null'
    LOOP
        -- JSON 배열인 경우 체크
        BEGIN
            hashtag_array := ARRAY(SELECT jsonb_array_elements_text(campaign_record.hashtags::jsonb));
        EXCEPTION
            WHEN OTHERS THEN
                -- JSON 파싱 실패시 문자열로 처리
                hashtag_array := string_to_array(campaign_record.hashtags, ' ');
        END;
        
        counter := 0;
        FOREACH hashtag_item IN ARRAY hashtag_array
        LOOP
            -- # 제거하고 빈 문자열 제외
            hashtag_item := TRIM(REPLACE(hashtag_item, '#', ''));
            IF LENGTH(hashtag_item) > 0 THEN
                INSERT INTO campaign_hashtags (id, "campaignId", hashtag, "order")
                VALUES (
                    generate_random_uuid(),
                    campaign_record.id,
                    hashtag_item,
                    counter
                )
                ON CONFLICT ("campaignId", hashtag) DO NOTHING;
                counter := counter + 1;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 플랫폼 마이그레이션 함수
CREATE OR REPLACE FUNCTION migrate_campaign_platforms() RETURNS void AS $$
DECLARE
    campaign_record RECORD;
    platform_item TEXT;
    platform_array TEXT[];
BEGIN
    FOR campaign_record IN 
        SELECT id, platform, platforms FROM campaigns 
        WHERE platform IS NOT NULL
    LOOP
        -- 기본 플랫폼 추가
        INSERT INTO campaign_platforms (id, "campaignId", platform, "isPrimary")
        VALUES (
            generate_random_uuid(),
            campaign_record.id,
            campaign_record.platform,
            true
        )
        ON CONFLICT ("campaignId", platform) DO NOTHING;
        
        -- platforms JSON이 있는 경우 추가 플랫폼들 처리
        IF campaign_record.platforms IS NOT NULL AND campaign_record.platforms != 'null' THEN
            platform_array := ARRAY(SELECT jsonb_array_elements_text(campaign_record.platforms::jsonb));
            
            FOREACH platform_item IN ARRAY platform_array
            LOOP
                IF platform_item != campaign_record.platform THEN
                    INSERT INTO campaign_platforms (id, "campaignId", platform, "isPrimary")
                    VALUES (
                        generate_random_uuid(),
                        campaign_record.id,
                        platform_item,
                        false
                    )
                    ON CONFLICT ("campaignId", platform) DO NOTHING;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 이미지 마이그레이션 함수
CREATE OR REPLACE FUNCTION migrate_campaign_images() RETURNS void AS $$
DECLARE
    campaign_record RECORD;
    image_item JSONB;
    counter INTEGER;
BEGIN
    FOR campaign_record IN 
        SELECT id, "imageUrl", "headerImageUrl", "thumbnailImageUrl", 
               "detailImages", "productImages"
        FROM campaigns 
    LOOP
        counter := 0;
        
        -- 기본 이미지들 처리
        IF campaign_record."imageUrl" IS NOT NULL THEN
            INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
            VALUES (generate_random_uuid(), campaign_record.id, campaign_record."imageUrl", 'MAIN', counter);
            counter := counter + 1;
        END IF;
        
        IF campaign_record."headerImageUrl" IS NOT NULL THEN
            INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
            VALUES (generate_random_uuid(), campaign_record.id, campaign_record."headerImageUrl", 'HEADER', counter);
            counter := counter + 1;
        END IF;
        
        IF campaign_record."thumbnailImageUrl" IS NOT NULL THEN
            INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
            VALUES (generate_random_uuid(), campaign_record.id, campaign_record."thumbnailImageUrl", 'THUMBNAIL', counter);
            counter := counter + 1;
        END IF;
        
        -- detailImages JSON 처리
        IF campaign_record."detailImages" IS NOT NULL AND campaign_record."detailImages" != 'null' THEN
            FOR image_item IN SELECT * FROM jsonb_array_elements(campaign_record."detailImages"::jsonb)
            LOOP
                INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
                VALUES (
                    generate_random_uuid(), 
                    campaign_record.id, 
                    image_item->>'url', 
                    'DETAIL', 
                    counter
                );
                counter := counter + 1;
            END LOOP;
        END IF;
        
        -- productImages JSON 처리
        IF campaign_record."productImages" IS NOT NULL AND campaign_record."productImages" != 'null' THEN
            FOR image_item IN SELECT * FROM jsonb_array_elements(campaign_record."productImages"::jsonb)
            LOOP
                INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
                VALUES (
                    generate_random_uuid(), 
                    campaign_record.id, 
                    image_item->>'url', 
                    'PRODUCT', 
                    counter
                );
                counter := counter + 1;
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 키워드 마이그레이션 함수
CREATE OR REPLACE FUNCTION migrate_campaign_keywords() RETURNS void AS $$
DECLARE
    campaign_record RECORD;
    keyword_item TEXT;
    keyword_array TEXT[];
    counter INTEGER;
BEGIN
    FOR campaign_record IN 
        SELECT id, keywords FROM campaigns 
        WHERE keywords IS NOT NULL AND keywords != ''
    LOOP
        keyword_array := string_to_array(campaign_record.keywords, ',');
        counter := 1;
        
        FOREACH keyword_item IN ARRAY keyword_array
        LOOP
            keyword_item := TRIM(keyword_item);
            IF LENGTH(keyword_item) > 0 THEN
                INSERT INTO campaign_keywords (id, "campaignId", keyword, weight)
                VALUES (
                    generate_random_uuid(),
                    campaign_record.id,
                    keyword_item,
                    counter
                )
                ON CONFLICT ("campaignId", keyword) DO NOTHING;
                counter := counter + 1;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- UUID 생성 함수 (cuid 대체)
CREATE OR REPLACE FUNCTION generate_random_uuid() RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(12), 'base64')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 마이그레이션 실행 (주석 처리 - 수동 실행 필요)
-- SELECT migrate_campaign_hashtags();
-- SELECT migrate_campaign_platforms();
-- SELECT migrate_campaign_images();
-- SELECT migrate_campaign_keywords();

-- 정규화된 테이블들을 위한 View 생성
CREATE OR REPLACE VIEW campaign_normalized AS
SELECT 
    c.*,
    -- 해시태그 집계
    hashtag_agg.hashtags as normalized_hashtags,
    -- 플랫폼 집계  
    platform_agg.platforms as normalized_platforms,
    platform_agg.primary_platform,
    -- 이미지 집계
    image_agg.images as normalized_images,
    -- 키워드 집계
    keyword_agg.keywords as normalized_keywords
FROM campaigns c
LEFT JOIN (
    SELECT 
        "campaignId",
        JSON_AGG(hashtag ORDER BY "order") as hashtags
    FROM campaign_hashtags
    GROUP BY "campaignId"
) hashtag_agg ON c.id = hashtag_agg."campaignId"
LEFT JOIN (
    SELECT 
        "campaignId",
        JSON_AGG(platform) as platforms,
        MAX(CASE WHEN "isPrimary" = true THEN platform END) as primary_platform
    FROM campaign_platforms
    GROUP BY "campaignId"
) platform_agg ON c.id = platform_agg."campaignId"
LEFT JOIN (
    SELECT 
        "campaignId",
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'url', "imageUrl",
                'type', type,
                'order', "order",
                'alt', alt,
                'caption', caption
            ) ORDER BY "order"
        ) as images
    FROM campaign_images
    GROUP BY "campaignId"
) image_agg ON c.id = image_agg."campaignId"
LEFT JOIN (
    SELECT 
        "campaignId",
        JSON_AGG(keyword ORDER BY weight DESC) as keywords
    FROM campaign_keywords
    GROUP BY "campaignId"
) keyword_agg ON c.id = keyword_agg."campaignId"
WHERE c."deletedAt" IS NULL;

COMMENT ON TABLE campaign_hashtags IS '캠페인 해시태그 정규화 테이블';
COMMENT ON TABLE campaign_platforms IS '캠페인 플랫폼 정규화 테이블';
COMMENT ON TABLE campaign_images IS '캠페인 이미지 정규화 테이블';
COMMENT ON TABLE campaign_keywords IS '캠페인 키워드 정규화 테이블';
COMMENT ON TABLE campaign_questions IS '캠페인 질문 정규화 테이블';
COMMENT ON VIEW campaign_normalized IS '정규화된 캠페인 데이터 통합 View';