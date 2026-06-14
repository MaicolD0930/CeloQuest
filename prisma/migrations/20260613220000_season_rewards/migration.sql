-- AlterTable
ALTER TABLE "WeeklySeason" ADD COLUMN     "rewardPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rewardWinnerWallet" TEXT,
ADD COLUMN     "rewardAmount" TEXT,
ADD COLUMN     "rewardTxHash" TEXT,
ADD COLUMN     "rewardPaidAt" TIMESTAMP(3);
