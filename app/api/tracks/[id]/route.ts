import { NextRequest, NextResponse } from "next/server";
import prisma from "@/../utils/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../utils/authOptions";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, artist, album, duration, s3Key } = await request.json();

  if (!title || !artist || !duration || !s3Key) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing audioId parameter" },
        { status: 400 },
      );
    }

    // Save the audio metadata and file URL to the database
    const track = await prisma.audio.update({
      data: {
        title,
        artist,
        album,
        duration: duration, // Duration in seconds
        s3Key,
        userId: user.id,
      },
      where: { id },
    });

    return NextResponse.json(
      {
        message: "Track updated successfully",
        track,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving track:", error);
    return NextResponse.json({ error: "Error saving track" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing audioId parameter" },
        { status: 400 },
      );
    }

    // Get all tracks for the authenticated user
    const track = await prisma.audio.findUnique({
      where: {
        id,
      },
    });

    return NextResponse.json({ track }, { status: 200 });
  } catch (error) {
    console.error("Error fetching track:", error);
    return NextResponse.json(
      { error: "Error fetching track" },
      { status: 500 },
    );
  }
}
