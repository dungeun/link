-- 샘플 카테고리 데이터 추가

-- 1. 대분류 카테고리들
INSERT INTO "Category" ("id", "name", "slug", "level", "icon", "color", "description", "isActive", "showInMenu", "menuOrder", "createdAt", "updatedAt") VALUES
('cat1', '뷰티', 'beauty', 1, '💄', '#E91E63', '뷰티 및 코스메틱 관련 캠페인', true, true, 1, NOW(), NOW()),
('cat2', '패션', 'fashion', 1, '👗', '#9C27B0', '패션 및 의류 관련 캠페인', true, true, 2, NOW(), NOW()),
('cat3', '푸드', 'food', 1, '🍔', '#FF5722', '음식 및 요리 관련 캠페인', true, true, 3, NOW(), NOW()),
('cat4', '여행', 'travel', 1, '✈️', '#2196F3', '여행 및 관광 관련 캠페인', true, true, 4, NOW(), NOW()),
('cat5', '테크', 'tech', 1, '💻', '#607D8B', '기술 및 디지털 제품 관련 캠페인', true, false, 5, NOW(), NOW());

-- 2. 중분류 카테고리들 (뷰티 하위)
INSERT INTO "Category" ("id", "name", "slug", "level", "parentId", "icon", "description", "isActive", "showInMenu", "createdAt", "updatedAt") VALUES
('cat1_1', '스킨케어', 'skincare', 2, 'cat1', '🧴', '스킨케어 제품 관련 캠페인', true, false, NOW(), NOW()),
('cat1_2', '메이크업', 'makeup', 2, 'cat1', '💋', '메이크업 제품 관련 캠페인', true, false, NOW(), NOW());

-- 3. 중분류 카테고리들 (패션 하위)
INSERT INTO "Category" ("id", "name", "slug", "level", "parentId", "icon", "description", "isActive", "showInMenu", "createdAt", "updatedAt") VALUES
('cat2_1', '의류', 'clothing', 2, 'cat2', '👕', '의류 관련 캠페인', true, false, NOW(), NOW()),
('cat2_2', '액세서리', 'accessories', 2, 'cat2', '💎', '액세서리 관련 캠페인', true, false, NOW(), NOW());

-- 4. 소분류 카테고리들 (스킨케어 하위)
INSERT INTO "Category" ("id", "name", "slug", "level", "parentId", "icon", "description", "isActive", "showInMenu", "createdAt", "updatedAt") VALUES
('cat1_1_1', '클렌저', 'cleanser', 3, 'cat1_1', '🧼', '클렌징 제품 관련 캠페인', true, false, NOW(), NOW()),
('cat1_1_2', '토너', 'toner', 3, 'cat1_1', '💧', '토너 제품 관련 캠페인', true, false, NOW(), NOW());

-- 5. 샘플 카테고리 페이지 생성 (뷰티 카테고리용)
INSERT INTO "CategoryPage" ("id", "categoryId", "title", "content", "layout", "heroSection", "filterOptions", "seoSettings", "isPublished", "publishedAt", "createdAt", "updatedAt") VALUES
('page1', 'cat1', '뷰티 캠페인', 
'{"sections": []}',
'grid',
'{"enabled": true, "title": "뷰티 캠페인", "subtitle": "최신 뷰티 트렌드를 선도하는 캠페인들을 만나보세요", "ctaText": "캠페인 보기"}',
'{"showSearch": true, "showSort": true, "showFilters": true, "availableFilters": ["platform", "budget", "followers"]}',
'{"metaTitle": "뷰티 캠페인 - 인플루언서 마케팅", "metaDescription": "뷰티 관련 인플루언서 마케팅 캠페인을 확인하세요", "keywords": ["뷰티", "캠페인", "인플루언서", "코스메틱"]}',
true, NOW(), NOW(), NOW());