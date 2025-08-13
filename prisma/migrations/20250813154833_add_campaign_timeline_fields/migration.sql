-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "applicationEndDate" TIMESTAMP(3),
ADD COLUMN     "applicationStartDate" TIMESTAMP(3),
ADD COLUMN     "campaignMission" TEXT,
ADD COLUMN     "contentEndDate" TIMESTAMP(3),
ADD COLUMN     "contentStartDate" TIMESTAMP(3),
ADD COLUMN     "keywords" TEXT,
ADD COLUMN     "provisionDetails" TEXT,
ADD COLUMN     "resultAnnouncementDate" TIMESTAMP(3);
