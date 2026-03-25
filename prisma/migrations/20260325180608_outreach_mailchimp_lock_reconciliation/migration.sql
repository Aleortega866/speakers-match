-- CreateTable
CREATE TABLE "OutreachRunLock" (
    "key" VARCHAR(50) NOT NULL,
    "run_id" VARCHAR(36) NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachRunLock_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OutreachReconciliation" (
    "id" SERIAL NOT NULL,
    "run_id" VARCHAR(36) NOT NULL,
    "campaign_id" VARCHAR(50) NOT NULL,
    "contact_ids_json" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachReconciliation_status_created_at_idx" ON "OutreachReconciliation"("status", "created_at");
