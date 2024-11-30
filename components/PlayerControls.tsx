import React, { useContext } from "react";
import { PlayerContext } from "@/context/PlayerContext";
import { FaPlay, FaPause, FaArrowLeft, FaArrowRight } from "react-icons/fa";

const PlayerControls = () => {
    const playerContext = useContext(PlayerContext);

    if (!playerContext) {
        throw new Error("PlayerControls must be used within a PlayerProvider");
    }

    const { isPlaying, handleNext, handlePrevious, togglePlayPause } =
        playerContext;

    return (
        <div className="flex items-center space-x-4">
            {/* Previous Button */}
            <button onClick={handlePrevious}>
                <FaArrowLeft />
            </button>

            {/* Play/Pause Button */}
            <button onClick={togglePlayPause}>
                {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            {/* Next Button */}
            <button onClick={handleNext}>
                <FaArrowRight />
            </button>
        </div>
    );
};

export default PlayerControls;
