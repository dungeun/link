-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "CampaignType" AS ENUM ('FREE', 'PAID', 'REVIEW');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "campaignType" "CampaignType" DEFAULT 'FREE';
ALTER TABLE "campaigns" ADD COLUMN "reviewPrice" DECIMAL(10,2);

-- 기존 isPaid 필드 기반으로 campaignType 설정
UPDATE "campaigns" SET "campaignType" = 'PAID' WHERE "isPaid" = true;
UPDATE "campaigns" SET "campaignType" = 'FREE' WHERE "isPaid" = false;

-- isPaid 필드는 유지 (하위 호환성을 위해)