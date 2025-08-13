-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "deliverables" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "detailedRequirements" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "location" TEXT DEFAULT '전국';
ALTER TABLE "campaigns" ADD COLUMN "maxApplicants" INTEGER DEFAULT 100;
ALTER TABLE "campaigns" ADD COLUMN "productImages" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "productIntro" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "viewCount" INTEGER DEFAULT 0;
ALTER TABLE "campaigns" ADD COLUMN "detailImages" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "platforms" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "rewardAmount" DOUBLE PRECISION DEFAULT 0;