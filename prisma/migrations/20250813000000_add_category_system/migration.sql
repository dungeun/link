-- CreateTable: 카테고리 시스템
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showInMenu" BOOLEAN NOT NULL DEFAULT false,
    "menuOrder" INTEGER,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "customPageContent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: 카테고리별 커스텀 페이지
CREATE TABLE "category_pages" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "layout" TEXT DEFAULT 'grid',
    "heroSection" JSONB,
    "featuredSection" JSONB,
    "filterOptions" JSONB,
    "customSections" JSONB,
    "seoSettings" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: 캠페인과 카테고리 연결 (다대다)
CREATE TABLE "campaign_categories" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_categories_pkey" PRIMARY KEY ("id")
);

-- Add Foreign Keys
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "category_pages" ADD CONSTRAINT "category_pages_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_categories" ADD CONSTRAINT "campaign_categories_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_categories" ADD CONSTRAINT "campaign_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create Indexes
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");
CREATE INDEX "categories_level_idx" ON "categories"("level");
CREATE INDEX "categories_isActive_idx" ON "categories"("isActive");
CREATE INDEX "categories_showInMenu_idx" ON "categories"("showInMenu");

CREATE UNIQUE INDEX "category_pages_categoryId_key" ON "category_pages"("categoryId");
CREATE INDEX "category_pages_isPublished_idx" ON "category_pages"("isPublished");

CREATE INDEX "campaign_categories_campaignId_idx" ON "campaign_categories"("campaignId");
CREATE INDEX "campaign_categories_categoryId_idx" ON "campaign_categories"("categoryId");
CREATE UNIQUE INDEX "campaign_categories_campaignId_categoryId_key" ON "campaign_categories"("campaignId", "categoryId");