-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

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

-- CreateTable
CREATE TABLE "PlaybackState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "shuffle" BOOLEAN NOT NULL DEFAULT false,
    "repeat" BOOLEAN NOT NULL DEFAULT false,
    "currentTrackIndex" INTEGER NOT NULL DEFAULT 0,
    "tracks" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaybackState_pkey" PRIMARY KEY ("id")
);

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
    "trackId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackState_userId_key" ON "PlaybackState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybackState_trackId_key" ON "PlaybackState"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_playlistId_position_key" ON "PlaylistTrack"("playlistId", "position");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackState" ADD CONSTRAINT "PlaybackState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybackState" ADD CONSTRAINT "PlaybackState_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
