-- Migration: Add Arcium Privacy Fields
-- Run this in Supabase SQL Editor

-- Add privacy fields to Certificate table
ALTER TABLE "Certificate" 
ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "encryptedDataId" TEXT,
ADD COLUMN IF NOT EXISTS "arciumSignature" TEXT,
ADD COLUMN IF NOT EXISTS "arciumDataHash" TEXT,
ADD COLUMN IF NOT EXISTS "authorizedViewers" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add indexes for Certificate privacy fields
CREATE INDEX IF NOT EXISTS "Certificate_isPrivate_idx" ON "Certificate"("isPrivate");
CREATE INDEX IF NOT EXISTS "Certificate_encryptedDataId_idx" ON "Certificate"("encryptedDataId");

-- Add privacy fields to SEMAReport table
ALTER TABLE "SEMAReport"
ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "encryptedReportId" TEXT,
ADD COLUMN IF NOT EXISTS "arciumSignature" TEXT,
ADD COLUMN IF NOT EXISTS "arciumDataHash" TEXT,
ADD COLUMN IF NOT EXISTS "authorizedAuditors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "totalStakeholders" INTEGER,
ADD COLUMN IF NOT EXISTS "totalMaterialTopics" INTEGER,
ADD COLUMN IF NOT EXISTS "complianceScore" DOUBLE PRECISION;

-- Add indexes for SEMAReport privacy fields
CREATE INDEX IF NOT EXISTS "SEMAReport_isPrivate_idx" ON "SEMAReport"("isPrivate");
CREATE INDEX IF NOT EXISTS "SEMAReport_encryptedReportId_idx" ON "SEMAReport"("encryptedReportId");

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Certificate' 
AND column_name IN ('isPrivate', 'encryptedDataId', 'arciumSignature', 'arciumDataHash', 'authorizedViewers')
ORDER BY ordinal_position;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'SEMAReport' 
AND column_name IN ('isPrivate', 'encryptedReportId', 'arciumSignature', 'arciumDataHash', 'authorizedAuditors', 'totalStakeholders', 'totalMaterialTopics', 'complianceScore')
ORDER BY ordinal_position;
