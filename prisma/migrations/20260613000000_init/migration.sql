-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '🌱',
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "weeklyXp" INTEGER NOT NULL DEFAULT 0,
    "weeklyDurationMs" INTEGER NOT NULL DEFAULT 0,
    "currentWeekKey" TEXT NOT NULL DEFAULT '',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "locale" TEXT NOT NULL DEFAULT 'es',
    "region" TEXT NOT NULL DEFAULT 'global',
    "participationStreak" INTEGER NOT NULL DEFAULT 0,
    "lastParticipatedWeekKey" TEXT NOT NULL DEFAULT '',
    "totalWeeksParticipated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "correctIndex" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTranslation" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "QuestionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL DEFAULT '',
    "questionIds" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '[]',
    "livesLeft" INTEGER NOT NULL DEFAULT 1,
    "lifeRefillUsed" BOOLEAN NOT NULL DEFAULT false,
    "result" TEXT NOT NULL DEFAULT 'in_progress',
    "refillTxHash" TEXT,
    "refillToken" TEXT,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "DailyAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySeason" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "WeeklySeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySeasonEntry" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "WeeklySeasonEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "nftTokenId" TEXT,
    "txHash" TEXT,
    "mintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardDistribution" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "rewardType" TEXT NOT NULL,
    "amount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTranslation_questionId_locale_key" ON "QuestionTranslation"("questionId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttempt_userId_date_key" ON "DailyAttempt"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklySeason_weekKey_key" ON "WeeklySeason"("weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklySeasonEntry_seasonId_userId_key" ON "WeeklySeasonEntry"("seasonId", "userId");

-- AddForeignKey
ALTER TABLE "QuestionTranslation" ADD CONSTRAINT "QuestionTranslation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttempt" ADD CONSTRAINT "DailyAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySeasonEntry" ADD CONSTRAINT "WeeklySeasonEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "WeeklySeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklySeasonEntry" ADD CONSTRAINT "WeeklySeasonEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "WeeklySeason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardDistribution" ADD CONSTRAINT "RewardDistribution_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "WeeklySeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardDistribution" ADD CONSTRAINT "RewardDistribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
