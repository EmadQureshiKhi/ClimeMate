-- Add global privacy setting to SEMAClient table

ALTER TABLE "SEMAClient"
ADD COLUMN IF NOT EXISTS "privacyMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "authorizedAuditors" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comment
COMMENT ON COLUMN "SEMAClient"."privacyMode" IS 'Global privacy setting for all SEMA operations for this client';
COMMENT ON COLUMN "SEMAClient"."authorizedAuditors" IS 'Wallet addresses authorized to decrypt this client''s SEMA data';

-- Verify
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'SEMAClient' 
AND column_name IN ('privacyMode', 'authorizedAuditors')
ORDER BY ordinal_position;
