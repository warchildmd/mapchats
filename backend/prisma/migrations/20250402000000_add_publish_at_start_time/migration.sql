-- AlterTable
ALTER TABLE "Post" ADD COLUMN "publishAt" TIMESTAMP(3);
ALTER TABLE "Post" ADD COLUMN "startTime" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Post_publishAt_idx" ON "Post"("publishAt");
