-- 수정된 마이그레이션 함수들

-- 해시태그 마이그레이션 함수 (수정)
CREATE OR REPLACE FUNCTION migrate_campaign_hashtags() RETURNS void AS $$
DECLARE
    campaign_record RECORD;
    hashtag_item TEXT;
    hashtag_array TEXT[];
    counter INTEGER;
BEGIN
    FOR campaign_record IN 
        SELECT id, hashtags FROM campaigns 
        WHERE hashtags IS NOT NULL AND hashtags != 'null' AND hashtags != ''
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
            hashtag_item := TRIM(REPLACE(hashtag_item, '"', ''));
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

-- 플랫폼 마이그레이션 함수 (수정)
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
        IF campaign_record.platforms IS NOT NULL AND campaign_record.platforms != 'null' AND campaign_record.platforms != '' THEN
            BEGIN
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
            EXCEPTION
                WHEN OTHERS THEN
                    -- JSON 파싱 실패시 무시
                    NULL;
            END;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 이미지 마이그레이션 함수 (수정)
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
        IF campaign_record."imageUrl" IS NOT NULL AND campaign_record."imageUrl" != '' THEN
            INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
            VALUES (generate_random_uuid(), campaign_record.id, campaign_record."imageUrl", 'MAIN', counter);
            counter := counter + 1;
        END IF;
        
        IF campaign_record."headerImageUrl" IS NOT NULL AND campaign_record."headerImageUrl" != '' THEN
            INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
            VALUES (generate_random_uuid(), campaign_record.id, campaign_record."headerImageUrl", 'HEADER', counter);
            counter := counter + 1;
        END IF;
        
        IF campaign_record."thumbnailImageUrl" IS NOT NULL AND campaign_record."thumbnailImageUrl" != '' THEN
            INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
            VALUES (generate_random_uuid(), campaign_record.id, campaign_record."thumbnailImageUrl", 'THUMBNAIL', counter);
            counter := counter + 1;
        END IF;
        
        -- detailImages JSON 처리
        IF campaign_record."detailImages" IS NOT NULL AND campaign_record."detailImages" != 'null' AND campaign_record."detailImages" != '' THEN
            BEGIN
                FOR image_item IN SELECT * FROM jsonb_array_elements(campaign_record."detailImages"::jsonb)
                LOOP
                    IF image_item ? 'url' AND (image_item->>'url') IS NOT NULL AND (image_item->>'url') != '' THEN
                        INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
                        VALUES (
                            generate_random_uuid(), 
                            campaign_record.id, 
                            image_item->>'url', 
                            'DETAIL', 
                            counter
                        );
                        counter := counter + 1;
                    END IF;
                END LOOP;
            EXCEPTION
                WHEN OTHERS THEN
                    -- JSON 파싱 실패시 무시
                    NULL;
            END;
        END IF;
        
        -- productImages JSON 처리
        IF campaign_record."productImages" IS NOT NULL AND campaign_record."productImages" != 'null' AND campaign_record."productImages" != '' THEN
            BEGIN
                FOR image_item IN SELECT * FROM jsonb_array_elements(campaign_record."productImages"::jsonb)
                LOOP
                    IF image_item ? 'url' AND (image_item->>'url') IS NOT NULL AND (image_item->>'url') != '' THEN
                        INSERT INTO campaign_images (id, "campaignId", "imageUrl", type, "order")
                        VALUES (
                            generate_random_uuid(), 
                            campaign_record.id, 
                            image_item->>'url', 
                            'PRODUCT', 
                            counter
                        );
                        counter := counter + 1;
                    END IF;
                END LOOP;
            EXCEPTION
                WHEN OTHERS THEN
                    -- JSON 파싱 실패시 무시
                    NULL;
            END;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;