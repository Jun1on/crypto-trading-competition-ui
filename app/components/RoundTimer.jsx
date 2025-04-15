"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";

const formatTime = (totalSeconds) => {
    if (totalSeconds < 0) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
};

const RoundTimer = ({ loading, isRoundEnded, isPreStart, timeLeft, progress, skeletonBaseColor, skeletonHighlightColor }) => {
    return (
        <>
            <div className="absolute bottom-5 right-5 text-sm font-medium text-white">
                {loading ? (
                    <Skeleton
                        width={60}
                        height={20}
                        baseColor={skeletonBaseColor}
                        highlightColor={skeletonHighlightColor}
                    />
                ) : isRoundEnded ? (
                    "Ended"
                ) : isPreStart && timeLeft !== null ? (
                    <span className="flex items-center">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                        Round starts in {timeLeft}s
                    </span>
                ) : timeLeft !== null ? (
                    formatTime(timeLeft)
                ) : (
                    <Skeleton
                        width={60}
                        height={20}
                        baseColor={skeletonBaseColor}
                        highlightColor={skeletonHighlightColor}
                    />
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0">
                <div className="w-full bg-gray-700 rounded-b-lg h-2 overflow-hidden">
                    {loading ? (
                        <div className="bg-gray-600 h-full" style={{ width: "0%" }}></div>
                    ) : (
                        <div
                            className={`h-full transition-all duration-1000 ease-linear ${isRoundEnded
                                ? "bg-red-500"
                                : isPreStart
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                                }`}
                            style={{
                                width: `${isPreStart && timeLeft !== null
                                    ? Math.min(
                                        100,
                                        Math.max(0, ((60 - Math.min(timeLeft, 60)) / 60) * 100)
                                    )
                                    : progress
                                    }%`,
                            }}
                        ></div>
                    )}
                </div>
            </div>
        </>
    );
};

export default RoundTimer;
