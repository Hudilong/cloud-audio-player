import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // Retrieve the user's playback state
        const playbackState = await prisma.playbackState.findUnique({
            where: { userId },
            include: {
                audio: true,
            },
        });

        if (!playbackState) {
            return NextResponse.json(
                { message: "No playback state found" },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                audioId: playbackState.audioId,
                position: playbackState.position,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching playback state:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { audioId, position } = body;

    if (!audioId || typeof position !== "number") {
        return NextResponse.json(
            { error: "audioId and position are required" },
            { status: 400 }
        );
    }

    try {
        // Verify the audio exists and is owned by the user
        const audio = await prisma.audio.findUnique({
            where: { id: audioId },
        });

        if (!audio || audio.userId !== userId) {
            return NextResponse.json(
                { error: "Access denied to this audio" },
                { status: 403 }
            );
        }

        // Update or create the playback state
        await prisma.playbackState.upsert({
            where: { userId },
            update: { audioId, position },
            create: { userId, audioId, position },
        });

        return NextResponse.json(
            { message: "Playback state updated" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating playback state:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
