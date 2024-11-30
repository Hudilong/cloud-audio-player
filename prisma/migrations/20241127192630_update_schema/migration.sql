/*
  Warnings:

  - Added the required column `updatedAt` to the `PlaybackState` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlaybackState" ADD COLUMN     "currentTrackIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPlaying" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repeat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shuffle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tracks" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "volume" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ALTER COLUMN "audioId" DROP NOT NULL,
ALTER COLUMN "position" SET DEFAULT 0,
ALTER COLUMN "position" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "audioId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_playlistId_position_key" ON "PlaylistTrack"("playlistId", "position");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
