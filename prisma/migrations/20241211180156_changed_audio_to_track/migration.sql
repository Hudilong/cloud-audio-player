/*
  Warnings:

  - You are about to drop the column `audioId` on the `PlaybackState` table. All the data in the column will be lost.
  - You are about to drop the column `audioId` on the `PlaylistTrack` table. All the data in the column will be lost.
  - You are about to drop the `Audio` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[trackId]` on the table `PlaybackState` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackId` to the `PlaylistTrack` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Audio" DROP CONSTRAINT "Audio_userId_fkey";

-- DropForeignKey
ALTER TABLE "PlaybackState" DROP CONSTRAINT "PlaybackState_audioId_fkey";

-- DropForeignKey
ALTER TABLE "PlaylistTrack" DROP CONSTRAINT "PlaylistTrack_audioId_fkey";

-- DropIndex
DROP INDEX "PlaybackState_audioId_key";

-- AlterTable
ALTER TABLE "PlaybackState" DROP COLUMN "audioId",
ADD COLUMN     "trackId" TEXT;

-- AlterTable
ALTER TABLE "PlaylistTrack" DROP COLUMN "audioId",
ADD COLUMN     "trackId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Audio";

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "artist" TEXT,
    "album" TEXT,
    "genre" TEXT,
    "imageURL" TEXT,
    "duration" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackState_trackId_key" ON "PlaybackState"("trackId");

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackState" ADD CONSTRAINT "PlaybackState_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
