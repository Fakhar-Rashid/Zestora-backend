-- AlterTable
ALTER TABLE "webhook_registrations" ADD COLUMN     "triggerType" TEXT;

-- CreateTable
CREATE TABLE "telegram_bot_configs" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "systemPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_bot_configs_pkey" PRIMARY KEY ("id")
);
