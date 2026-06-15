-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

-- Backfill existing rows that were already minted
UPDATE "Achievement" SET "status" = 'claimed' WHERE "nftTokenId" IS NOT NULL;
