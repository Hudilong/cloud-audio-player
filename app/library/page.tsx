"use client";

import React, { useEffect, useContext, useState } from "react";
import { Audio } from "@prisma/client";
import { PlayerContext } from "@/context/PlayerContext";
import AudioCard from "../../components/AudioCard";

const dummyTracks = [
    {
        id: "cm4hin3h9emkqpbqufftkv99",
        title: "Shimmer",
        artist: "Luna Vale",
        album: "Solar Beats",
        genre: "Techno",
        duration: 358,
        s3Key: "3b5ILjNW0EvnjTMzgKUL.wav",
        userId: "cm40bv5yb4fwiruas6uya",
        createdAt: "2024-11-16T22:06:49.149592",
        updatedAt: "2024-11-24T22:06:49.149608",
    },
    {
        id: "cm45gz7idjiu39cq8izwewld",
        title: "Aurora",
        artist: "Hudilong",
        album: "Tech Vibes",
        genre: "Downtempo",
        duration: 360,
        s3Key: "JBcu0l9tRECNOEIj9H8P.wav",
        userId: "cm40bv5yb4fwiruas6uya",
        createdAt: "2024-11-25T22:06:49.149631",
        updatedAt: "2024-11-25T22:06:49.149635",
    },
    {
        id: "cm4y4k27ujnndxh41x1cb6sy",
        title: "Fade Into You",
        artist: "Hudilong",
        album: "Urban Flux",
        genre: "Chillwave",
        duration: 330,
        s3Key: "oZeBAe70nBuF5sKjV6wJ.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-07T22:06:49.149660",
        updatedAt: "2024-11-12T22:06:49.149670",
    },
    {
        id: "cm4rwcm4v6sixd5dcc2bmyn2",
        title: "Fade Into You",
        artist: "Hudilong",
        album: "Mellow Grooves",
        genre: "Chillwave",
        duration: 216,
        s3Key: "8eu61ujbS33btNDx2avQ.wav",
        userId: "cm40bv5yb4fwiruas6uya",
        createdAt: "2024-11-09T22:06:49.149694",
        updatedAt: "2024-11-11T22:06:49.149700",
    },
    {
        id: "cm4kgqxzjwvcgtgq7cvmzvx5",
        title: "Neon Dreams",
        artist: "Luna Vale",
        album: "Solar Beats",
        genre: "Downtempo",
        duration: 219,
        s3Key: "UChXy-66lw4jdKNiApQA.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-13T22:06:49.149720",
        updatedAt: "2024-11-10T22:06:49.149723",
    },
    {
        id: "cm4p49p3o4dlbb0v4azd2cl9",
        title: "Aurora",
        artist: "Digital Nomad",
        album: "Echoes in Time",
        genre: "Electro",
        duration: 303,
        s3Key: "yvV6JeJrm7E3CeLs3mfx.wav",
        userId: "cm40bn0vsjyknvb4jizbv",
        createdAt: "2024-11-07T22:06:49.149746",
        updatedAt: "2024-11-03T22:06:49.149751",
    },
    {
        id: "cm45owctmqfd61n9nixo64in",
        title: "Solstice",
        artist: "Echo Flow",
        album: "Solar Beats",
        genre: "Trance",
        duration: 304,
        s3Key: "RgHoxn44WjAdKEag8mYs.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-19T22:06:49.149769",
        updatedAt: "2024-11-15T22:06:49.149772",
    },
    {
        id: "cm4fwwtk4mz95tipqkzt6rhi",
        title: "Shimmer",
        artist: "Digital Nomad",
        album: "Tech Vibes",
        genre: "Techno",
        duration: 300,
        s3Key: "NfjOoC034JxMNRxfhqpk.wav",
        userId: "cm40bn0vsjyknvb4jizbv",
        createdAt: "2024-11-13T22:06:49.149789",
        updatedAt: "2024-11-13T22:06:49.149795",
    },
    {
        id: "cm4q3dhhri1cs95oqg91jzu4",
        title: "Shimmer",
        artist: "Hudilong",
        album: "Tech Vibes",
        genre: "Trance",
        duration: 270,
        s3Key: "6KwEbDSxQKxFQG_d80Wm.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-07T22:06:49.149816",
        updatedAt: "2024-11-09T22:06:49.149819",
    },
    {
        id: "cm445kbsa7pxmshvgelqvigt",
        title: "Fade Into You",
        artist: "McGrath",
        album: "Tech Vibes",
        genre: "Techno",
        duration: 186,
        s3Key: "r1qz0ZEiHWxqAuRG9J2y.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-25T22:06:49.149833",
        updatedAt: "2024-11-20T22:06:49.149836",
    },
    {
        id: "cm424ekcdwxm5h2bg07bphls",
        title: "Skyline",
        artist: "Bassline Theory",
        album: "Mellow Grooves",
        genre: "Chillwave",
        duration: 213,
        s3Key: "y3ngUeLMSCRKHAEEhBmV.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-25T22:06:49.149849",
        updatedAt: "2024-11-26T22:06:49.149852",
    },
    {
        id: "cm4a7r4g2lra5w8q0h546l2q",
        title: "Fade Into You",
        artist: "Hudilong",
        album: "Urban Flux",
        genre: "Electro",
        duration: 354,
        s3Key: "ogR73-Im67ve9Jsy4gKC.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-20T22:06:49.149866",
        updatedAt: "2024-11-24T22:06:49.149870",
    },
    {
        id: "cm4u0u68eyk9krkk6mlvgnwy",
        title: "Solstice",
        artist: "Hudilong",
        album: "Urban Flux",
        genre: "Electro",
        duration: 251,
        s3Key: "rkYwCvrv_jKR78LDib7y.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-23T22:06:49.149892",
        updatedAt: "2024-11-26T22:06:49.149896",
    },
    {
        id: "cm4vwhx96l58sx59f6toci02",
        title: "Fade Into You",
        artist: "Hudilong",
        album: "Urban Flux",
        genre: "Trance",
        duration: 229,
        s3Key: "7Xdl8LgMLubKL5AXWtje.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-01T22:06:49.149913",
        updatedAt: "2024-11-17T22:06:49.149916",
    },
    {
        id: "cm4uh36yvtr81ogejd4euxr9",
        title: "Fade Into You",
        artist: "Echo Flow",
        album: "Starlight Drift",
        genre: "Chillwave",
        duration: 339,
        s3Key: "ZlOX9A1jXqLDvbDALj_X.wav",
        userId: "cm40bv5yb4fwiruas6uya",
        createdAt: "2024-11-15T22:06:49.149928",
        updatedAt: "2024-11-10T22:06:49.149931",
    },
    {
        id: "cm4xfxti7q3gzswyi1fst1mx",
        title: "Shimmer",
        artist: "McGrath",
        album: "Urban Flux",
        genre: "Ambient",
        duration: 223,
        s3Key: "ZCfzMiVXiA9SvQEK2e_D.wav",
        userId: "cm40b3aq69cdpty409pkw",
        createdAt: "2024-11-27T22:06:49.149953",
        updatedAt: "2024-11-19T22:06:49.149956",
    },
    {
        id: "cm4sgx1ewg37nvz6nt7kz9hx",
        title: "Aurora",
        artist: "Hudilong",
        album: "Mellow Grooves",
        genre: "House",
        duration: 300,
        s3Key: "mwAa7C82TaTVeaZ2BuUa.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-19T22:06:49.149970",
        updatedAt: "2024-11-18T22:06:49.149972",
    },
    {
        id: "cm4jddvu2h2izz0h5dlwmmxj",
        title: "Aurora",
        artist: "Echo Flow",
        album: "Tech Vibes",
        genre: "Techno",
        duration: 223,
        s3Key: "yZxp5VgvUeN6TNugIdV5.wav",
        userId: "cm40b3aq69cdpty409pkw",
        createdAt: "2024-11-13T22:06:49.149985",
        updatedAt: "2024-11-10T22:06:49.149987",
    },
    {
        id: "cm4f9om8k7d2a0zfuwxrlqqt",
        title: "Again",
        artist: "Echo Flow",
        album: "Starlight Drift",
        genre: "Lo-Fi",
        duration: 180,
        s3Key: "ZLwGpY9S-vuZCmjr5ea6.wav",
        userId: "cm40bn0vsjyknvb4jizbv",
        createdAt: "2024-11-25T22:06:49.150001",
        updatedAt: "2024-11-11T22:06:49.150004",
    },
    {
        id: "cm4q84z5b7513tix6vlv1qn0",
        title: "Solstice",
        artist: "Eclipse",
        album: "Starlight Drift",
        genre: "Trance",
        duration: 317,
        s3Key: "Pq_WLABrqR9Zkz5pkQF3.wav",
        userId: "cm40b3aq69cdpty409pkw",
        createdAt: "2024-11-04T22:06:49.150017",
        updatedAt: "2024-11-13T22:06:49.150019",
    },
    {
        id: "cm4hin3h9emkqpbqufftkv99",
        title: "Shimmer",
        artist: "Luna Vale",
        album: "Solar Beats",
        genre: "Techno",
        duration: 358,
        s3Key: "3b5ILjNW0EvnjTMzgKUL.wav",
        userId: "cm40bv5yb4fwiruas6uya",
        createdAt: "2024-11-16T22:06:49.149592",
        updatedAt: "2024-11-24T22:06:49.149608",
    },
    {
        id: "cm45gz7idjiu39cq8izwewld",
        title: "Aurora",
        artist: "Hudilong",
        album: "Tech Vibes",
        genre: "Downtempo",
        duration: 360,
        s3Key: "JBcu0l9tRECNOEIj9H8P.wav",
        userId: "cm40bv5yb4fwiruas6uya",
        createdAt: "2024-11-25T22:06:49.149631",
        updatedAt: "2024-11-25T22:06:49.149635",
    },
    {
        id: "cm4y4k27ujnndxh41x1cb6sy",
        title: "Fade Into You",
        artist: "Hudilong",
        album: "Urban Flux",
        genre: "Chillwave",
        duration: 330,
        s3Key: "oZeBAe70nBuF5sKjV6wJ.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-07T22:06:49.149660",
        updatedAt: "2024-11-12T22:06:49.149670",
    },
    {
        id: "cm4rwcm4v6sixd5dcc2bmyn2",
        title: "Fade Into You",
        artist: "Hudilong",
        album: "Mellow Grooves",
        genre: "Chillwave",
        duration: 216,
        s3Key: "8eu61ujbS33btNDx2avQ.wav",
        userId: "cm40bv5yb4fwiruas6uya",
        createdAt: "2024-11-09T22:06:49.149694",
        updatedAt: "2024-11-11T22:06:49.149700",
    },
    {
        id: "cm4kgqxzjwvcgtgq7cvmzvx5",
        title: "Neon Dreams",
        artist: "Luna Vale",
        album: "Solar Beats",
        genre: "Downtempo",
        duration: 219,
        s3Key: "UChXy-66lw4jdKNiApQA.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-13T22:06:49.149720",
        updatedAt: "2024-11-10T22:06:49.149723",
    },
    {
        id: "cm4p49p3o4dlbb0v4azd2cl9",
        title: "Aurora",
        artist: "Digital Nomad",
        album: "Echoes in Time",
        genre: "Electro",
        duration: 303,
        s3Key: "yvV6JeJrm7E3CeLs3mfx.wav",
        userId: "cm40bn0vsjyknvb4jizbv",
        createdAt: "2024-11-07T22:06:49.149746",
        updatedAt: "2024-11-03T22:06:49.149751",
    },
    {
        id: "cm45owctmqfd61n9nixo64in",
        title: "Solstice",
        artist: "Echo Flow",
        album: "Solar Beats",
        genre: "Trance",
        duration: 304,
        s3Key: "RgHoxn44WjAdKEag8mYs.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-19T22:06:49.149769",
        updatedAt: "2024-11-15T22:06:49.149772",
    },
    {
        id: "cm4fwwtk4mz95tipqkzt6rhi",
        title: "Shimmer",
        artist: "Digital Nomad",
        album: "Tech Vibes",
        genre: "Techno",
        duration: 300,
        s3Key: "NfjOoC034JxMNRxfhqpk.wav",
        userId: "cm40bn0vsjyknvb4jizbv",
        createdAt: "2024-11-13T22:06:49.149789",
        updatedAt: "2024-11-13T22:06:49.149795",
    },
    {
        id: "cm4q3dhhri1cs95oqg91jzu4",
        title: "Shimmer",
        artist: "Hudilong",
        album: "Tech Vibes",
        genre: "Trance",
        duration: 270,
        s3Key: "6KwEbDSxQKxFQG_d80Wm.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-07T22:06:49.149816",
        updatedAt: "2024-11-09T22:06:49.149819",
    },
    {
        id: "cm445kbsa7pxmshvgelqvigt",
        title: "Fade Into You",
        artist: "McGrath",
        album: "Tech Vibes",
        genre: "Techno",
        duration: 186,
        s3Key: "r1qz0ZEiHWxqAuRG9J2y.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-25T22:06:49.149833",
        updatedAt: "2024-11-20T22:06:49.149836",
    },
    {
        id: "cm424ekcdwxm5h2bg07bphls",
        title: "Skyline",
        artist: "Bassline Theory",
        album: "Mellow Grooves",
        genre: "Chillwave",
        duration: 213,
        s3Key: "y3ngUeLMSCRKHAEEhBmV.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-25T22:06:49.149849",
        updatedAt: "2024-11-26T22:06:49.149852",
    },
    {
        id: "cm4a7r4g2lra5w8q0h546l2q",
        title: "Fade Into You",
        artist: "Hudilong",
        album: "Urban Flux",
        genre: "Electro",
        duration: 354,
        s3Key: "ogR73-Im67ve9Jsy4gKC.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-20T22:06:49.149866",
        updatedAt: "2024-11-24T22:06:49.149870",
    },
    {
        id: "cm4u0u68eyk9krkk6mlvgnwy",
        title: "Solstice",
        artist: "Hudilong",
        album: "Urban Flux",
        genre: "Electro",
        duration: 251,
        s3Key: "rkYwCvrv_jKR78LDib7y.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-23T22:06:49.149892",
        updatedAt: "2024-11-26T22:06:49.149896",
    },
    {
        id: "cm4vwhx96l58sx59f6toci02",
        title: "Fade Into You",
        artist: "Hudilong",
        album: "Urban Flux",
        genre: "Trance",
        duration: 229,
        s3Key: "7Xdl8LgMLubKL5AXWtje.wav",
        userId: "cm40bwpzswyp61zjl5lo0",
        createdAt: "2024-11-01T22:06:49.149913",
        updatedAt: "2024-11-17T22:06:49.149916",
    },
    {
        id: "cm4uh36yvtr81ogejd4euxr9",
        title: "Fade Into You",
        artist: "Echo Flow",
        album: "Starlight Drift",
        genre: "Chillwave",
        duration: 339,
        s3Key: "ZlOX9A1jXqLDvbDALj_X.wav",
        userId: "cm40bv5yb4fwiruas6uya",
        createdAt: "2024-11-15T22:06:49.149928",
        updatedAt: "2024-11-10T22:06:49.149931",
    },
    {
        id: "cm4xfxti7q3gzswyi1fst1mx",
        title: "Shimmer",
        artist: "McGrath",
        album: "Urban Flux",
        genre: "Ambient",
        duration: 223,
        s3Key: "ZCfzMiVXiA9SvQEK2e_D.wav",
        userId: "cm40b3aq69cdpty409pkw",
        createdAt: "2024-11-27T22:06:49.149953",
        updatedAt: "2024-11-19T22:06:49.149956",
    },
    {
        id: "cm4sgx1ewg37nvz6nt7kz9hx",
        title: "Aurora",
        artist: "Hudilong",
        album: "Mellow Grooves",
        genre: "House",
        duration: 300,
        s3Key: "mwAa7C82TaTVeaZ2BuUa.wav",
        userId: "cm40bf8dwi9bxkm9mp60d",
        createdAt: "2024-11-19T22:06:49.149970",
        updatedAt: "2024-11-18T22:06:49.149972",
    },
    {
        id: "cm4jddvu2h2izz0h5dlwmmxj",
        title: "Aurora",
        artist: "Echo Flow",
        album: "Tech Vibes",
        genre: "Techno",
        duration: 223,
        s3Key: "yZxp5VgvUeN6TNugIdV5.wav",
        userId: "cm40b3aq69cdpty409pkw",
        createdAt: "2024-11-13T22:06:49.149985",
        updatedAt: "2024-11-10T22:06:49.149987",
    },
    {
        id: "cm4f9om8k7d2a0zfuwxrlqqt",
        title: "Again",
        artist: "Echo Flow",
        album: "Starlight Drift",
        genre: "Lo-Fi",
        duration: 180,
        s3Key: "ZLwGpY9S-vuZCmjr5ea6.wav",
        userId: "cm40bn0vsjyknvb4jizbv",
        createdAt: "2024-11-25T22:06:49.150001",
        updatedAt: "2024-11-11T22:06:49.150004",
    },
    {
        id: "cm4q84z5b7513tix6vlv1qn0",
        title: "Solstice",
        artist: "Eclipse",
        album: "Starlight Drift",
        genre: "Trance",
        duration: 317,
        s3Key: "Pq_WLABrqR9Zkz5pkQF3.wav",
        userId: "cm40b3aq69cdpty409pkw",
        createdAt: "2024-11-04T22:06:49.150017",
        updatedAt: "2024-11-13T22:06:49.150019",
    },
];

export default function Library(): JSX.Element {
    const playerContext = useContext(PlayerContext);
    const [library, setLibrary] = useState<Audio[]>([]);

    if (!playerContext) {
        throw new Error("Library must be used within a PlayerProvider");
    }

    const {
        setAudio,
        setCurrentTime,
        setIsPlaying,
        setCurrentTrackIndex,
        setPlaylist,
    } = playerContext;

    useEffect(() => {
        //Fetch the user's audio tracks
        // async function fetchTracks() {
        //     try {
        //         const res = await fetch("/api/tracks");
        //         if (res.ok) {
        //             const data = await res.json();
        //             setLibrary(data.tracks);
        //         } else {
        //             console.error("Failed to fetch tracks");
        //         }
        //     } catch (error) {
        //         console.error("Error fetching tracks:", error);
        //     }
        // }
        // fetchTracks();
        setLibrary(dummyTracks);
    }, []);

    const handleTrackSelect = (selectedAudio: Audio) => {
        setPlaylist(library);
        const index = library.findIndex(
            (track) => track.id === selectedAudio.id
        );
        setCurrentTrackIndex(index);
        setAudio(selectedAudio);
        setCurrentTime(0);
        setIsPlaying(true);
    };

    if (!library || library.length === 0) {
        return <p>You haven&apos;t uploaded any audio tracks yet.</p>;
    }

    return (
        <div className="w-full flex-col px-48 py-32">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-16">
                {library.map((track) => (
                    <AudioCard
                        track={track}
                        onSelect={handleTrackSelect}
                        key={track.id}
                    />
                ))}
            </div>
        </div>
    );
}
