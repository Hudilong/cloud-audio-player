"use client";

import React, { useRef } from "react";

export default function Settings() {
    const audioRef = useRef<HTMLAudioElement>(null);

    return (
        <>
            <div>Settings</div>
            <audio
                ref={audioRef}
                src="https://streaming-platform-uploads-4a36d361-96a3-4c06-b126-f9c80fa85611.s3.us-east-1.amazonaws.com/aolvF3sJlpafp1EgN-ln8.wav"
                preload="auto"
                controls
            />
        </>
    );
}
