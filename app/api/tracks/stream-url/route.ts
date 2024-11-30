import { NextRequest, NextResponse } from "next/server";
import AWS from "aws-sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import prisma from "@/../utils/prisma";

AWS.config.update({
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
});

const s3 = new AWS.S3();

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || typeof id !== "string") {
        return NextResponse.json(
            { error: "Invalid audio ID" },
            { status: 400 }
        );
    }

    const audio = await prisma.audio.findUnique({
        where: { id },
    });

    if (!audio) {
        return NextResponse.json({ error: "Audio not found" }, { status: 404 });
    }

    console.log(audio.s3Key);

    const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: audio.s3Key,
        Expires: 600,
    };

    try {
        const streamURL = await s3.getSignedUrlPromise("getObject", s3Params);

        return NextResponse.json({ streamURL }, { status: 200 });
    } catch (error) {
        console.error("Error generating pre-signed URL", error);
        return NextResponse.json(
            { error: "Error generating pre-signed URL" },
            { status: 500 }
        );
    }
}
