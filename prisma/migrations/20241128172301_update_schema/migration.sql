/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Audio` table. All the data in the column will be lost.
  - Added the required column `s3Key` to the `Audio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Audio" DROP COLUMN "fileUrl",
ADD COLUMN     "s3Key" TEXT NOT NULL;
