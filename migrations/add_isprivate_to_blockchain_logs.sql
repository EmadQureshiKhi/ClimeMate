-- Add isPrivate field to SEMABlockchainLog table
-- This tracks whether a blockchain log is for a privacy-mode operation

ALTER TABLE "SEMABlockchainLog" 
ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster queries on privacy mode
CREATE INDEX "SEMABlockchainLog_isPrivate_idx" ON "SEMABlockchainLog"("isPrivate");

-- Update existing records to have isPrivate = false (default)
-- This is already handled by the DEFAULT false constraint
