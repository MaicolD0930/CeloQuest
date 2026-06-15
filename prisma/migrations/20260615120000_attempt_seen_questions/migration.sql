-- Track questions already shown today (for demo retries without repeating).
ALTER TABLE "DailyAttempt" ADD COLUMN "seenQuestionIds" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "DailyAttempt" ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;
