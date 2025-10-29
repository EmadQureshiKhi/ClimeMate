-- Migration: Add Points Redemption System
-- Run this in Supabase SQL Editor

-- 1. Update ChargingPoints table to add spent and purchased columns
ALTER TABLE "ChargingPoints" 
ADD COLUMN IF NOT EXISTS "spent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "purchased" INTEGER NOT NULL DEFAULT 0;

-- 2. Create PointsRedemption table
CREATE TABLE IF NOT EXISTS "PointsRedemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "rewardName" TEXT NOT NULL,
    "rewardCategory" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "redemptionCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "PointsRedemption_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Create indexes for PointsRedemption
CREATE INDEX IF NOT EXISTS "PointsRedemption_userWallet_idx" ON "PointsRedemption"("userWallet");
CREATE INDEX IF NOT EXISTS "PointsRedemption_status_idx" ON "PointsRedemption"("status");
CREATE INDEX IF NOT EXISTS "PointsRedemption_userId_idx" ON "PointsRedemption"("userId");

-- 4. Add comments for documentation
COMMENT ON TABLE "PointsRedemption" IS 'Tracks points redemptions for rewards in the marketplace';
COMMENT ON COLUMN "PointsRedemption"."rewardId" IS 'Unique identifier for the reward (e.g., free-session, nft-badge)';
COMMENT ON COLUMN "PointsRedemption"."rewardCategory" IS 'Category: charging, digital, or partner';
COMMENT ON COLUMN "PointsRedemption"."redemptionCode" IS 'Unique code for redeeming the reward';
COMMENT ON COLUMN "PointsRedemption"."status" IS 'Status: pending, completed, used, or expired';

-- 5. Verify the changes
SELECT 
    'ChargingPoints columns' as table_info,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'ChargingPoints'
ORDER BY ordinal_position;

SELECT 
    'PointsRedemption table created' as status,
    COUNT(*) as row_count
FROM "PointsRedemption";

-- Success message
SELECT 'Migration completed successfully! ✅' as message;
