-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "maxInfluencers" INTEGER,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_options" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_plans_name_key" ON "pricing_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_options_code_key" ON "pricing_options"("code");

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "pricingPlanId" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "selectedOptions" JSONB;
ALTER TABLE "campaigns" ADD COLUMN "totalPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "itemType" TEXT;
ALTER TABLE "payments" ADD COLUMN "itemId" TEXT;
ALTER TABLE "payments" ADD COLUMN "breakdown" JSONB;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "pricing_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;