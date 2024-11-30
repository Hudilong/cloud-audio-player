import { Audio } from "@prisma/client";

export type TrackInfo = Omit<
    Audio,
    "s3Key" | "userId" | "id" | "createdAt" | "updatedAt"
>;
