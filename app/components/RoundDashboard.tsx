"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getLatestRoundDetails } from "../../utils/contract";
import {
  DocumentDuplicateIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const REFRESH_INTERVAL = 5000;

// Helper function to format time in MM:SS
const formatTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const RoundDashboard = () => {
  const [roundDetails, setRoundDetails] = useState({
    currentRound: 0,
    tokenAddress: null,
    tokenName: "",
    tokenSymbol: "",
    startTime: 0,
    endTime: 0,
    airdropAmount: 0,
    USDM: "",
  });
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isRoundEnded, setIsRoundEnded] = useState<boolean>(false);
  const [isPreStart, setIsPreStart] = useState<boolean>(false);

  // Custom skeleton theme to match dark background
  const skeletonBaseColor = "#2d3748"; // dark gray
  const skeletonHighlightColor = "#4a5568"; // slightly lighter gray

  const fetchRoundInfo = async () => {
    try {
      const details = await getLatestRoundDetails();

      setRoundDetails({
        currentRound: details.latestRound,
        tokenAddress: details.token,
        tokenName: details.name,
        tokenSymbol: details.symbol,
        startTime: details.startTimestamp,
        endTime: details.endTimestamp,
        airdropAmount: details.airdropPerParticipantUSDM,
        USDM: details.USDM,
      });
    } catch (error) {
      console.error("Error fetching round info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoundInfo();
    const interval = setInterval(fetchRoundInfo, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Timer effect
  useEffect(() => {
    if (loading || roundDetails.startTime === 0 || roundDetails.endTime === 0) {
      setIsRoundEnded(false); // Reset if loading or times are invalid
      setIsPreStart(false); // Reset pre-start state
      setProgress(0);
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const { startTime, endTime } = roundDetails;
      const totalDuration = endTime - startTime;
      const remaining = endTime - now;
      const elapsed = now - startTime;

      // Check if we're in the pre-start phase
      if (now < startTime) {
        const preStartRemaining = startTime - now;
        setTimeLeft(preStartRemaining);
        setProgress(0); // 0% progress during pre-start
        setIsRoundEnded(false);
        setIsPreStart(true);
        return true; // Continue interval
      }

      if (totalDuration <= 0) {
        // Avoid division by zero or negative duration
        setIsRoundEnded(true);
        setIsPreStart(false);
        setTimeLeft(0);
        setProgress(100);
        return null; // Stop interval if duration is invalid
      }

      if (remaining <= 0) {
        setTimeLeft(0);
        setProgress(100);
        setIsRoundEnded(true);
        setIsPreStart(false);
        return null; // Stop interval
      } else {
        setTimeLeft(remaining);
        setProgress(
          Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
        );
        setIsRoundEnded(false);
        setIsPreStart(false);
        return true; // Continue interval
      }
    };

    // Initial calculation
    const shouldContinue = calculateTime();
    if (!shouldContinue) return;

    const timerInterval = setInterval(() => {
      if (!calculateTime()) {
        clearInterval(timerInterval);
      }
    }, 1000);

    // Cleanup interval on unmount or dependency change
    return () => clearInterval(timerInterval);
  }, [roundDetails, roundDetails.startTime, roundDetails.endTime, loading]);

  const handleCopy = () => {
    const { tokenAddress } = roundDetails;
    if (tokenAddress && tokenAddress !== ethers.ZeroAddress) {
      navigator.clipboard.writeText(tokenAddress);
      toast.success("Address copied to clipboard!", { duration: 2000 });
    }
  };

  const truncatedAddress =
    roundDetails.tokenAddress &&
    roundDetails.tokenAddress !== ethers.ZeroAddress
      ? `${roundDetails.tokenAddress.slice(
          0,
          6
        )}...${roundDetails.tokenAddress.slice(-4)}`
      : null;

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 mx-auto rounded-lg shadow-lg p-10 mb-5 max-w-4xl relative overflow-hidden pb-5">
      <div className={`flex flex-col items-center text-white gap-4`}>
        <div className="text-3xl font-bold">
          {loading ? (
            <Skeleton
              width={120}
              height={34}
              baseColor={skeletonBaseColor}
              highlightColor={skeletonHighlightColor}
            />
          ) : (
            `Round ${roundDetails.currentRound}`
          )}
        </div>
        <div className="text-2xl text-orange-500 text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton
                width={120}
                height={24}
                baseColor={skeletonBaseColor}
                highlightColor={skeletonHighlightColor}
              />
              <Skeleton
                width={200}
                height={68}
                baseColor={skeletonBaseColor}
                highlightColor={skeletonHighlightColor}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div>
                {roundDetails.tokenName || "waiting for round to start"}
              </div>
              {roundDetails.tokenSymbol ? (
                <div className="text-7xl font-bold">
                  ${roundDetails.tokenSymbol.toUpperCase()}
                </div>
              ) : (
                <Skeleton
                  width={200}
                  height={68}
                  baseColor={skeletonBaseColor}
                  highlightColor={skeletonHighlightColor}
                />
              )}
            </div>
          )}
        </div>

        {/* Address and Links */}
        <div className="flex items-center text-sm text-gray-400 mt-2">
          {" "}
          {/* Reduced margin top */}
          {loading ? (
            <Skeleton
              width={272}
              height={20}
              baseColor={skeletonBaseColor}
              highlightColor={skeletonHighlightColor}
            />
          ) : (
            <>
              <span className="font-mono">{truncatedAddress}</span>
              <button
                onClick={handleCopy}
                className="ml-2 p-1 hover:text-gray-300 transition-colors cursor-pointer"
                title="Copy address"
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
              {roundDetails.tokenAddress &&
                roundDetails.tokenAddress !== ethers.ZeroAddress &&
                (isPreStart ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`https://dexscreener.com/optimism/${roundDetails.tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 flex items-center text-blue-400 hover:text-blue-300 transition-colors opacity-70"
                        >
                          <ChartBarIcon className="w-4 h-4 mr-1" />
                          <span>Chart</span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Chart loading... please refresh if not loading
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <a
                    href={`https://dexscreener.com/optimism/${roundDetails.tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    title="View on DexScreener"
                  >
                    <ChartBarIcon className="w-4 h-4 mr-1" />
                    <span>Chart</span>
                  </a>
                ))}
              {roundDetails.tokenAddress &&
                roundDetails.USDM &&
                roundDetails.tokenAddress !== ethers.ZeroAddress && (
                  <a
                    href="/swap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ml-3 flex items-center text-blue-400 hover:text-blue-300 transition-colors ${
                      isRoundEnded || isPreStart ? "opacity-70" : ""
                    }`}
                    title={
                      isRoundEnded ? "Round has ended" : "Trade on Uniswap"
                    }
                  >
                    <ArrowsRightLeftIcon className="w-4 h-4 mr-1" />
                    <span>Trade</span>
                  </a>
                )}
            </>
          )}
        </div>
      </div>
      <Toaster />

      <div className="absolute bottom-5.5 right-5.5 text-sm font-medium text-white">
        {loading ? (
          <Skeleton
            width={50}
            height={14}
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
            width={50}
            height={14}
            baseColor={skeletonBaseColor}
            highlightColor={skeletonHighlightColor}
          />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        {" "}
        <div className="w-full bg-gray-700 rounded-b-lg h-2 overflow-hidden">
          {loading ? (
            <div className="bg-gray-600 h-full" style={{ width: "0%" }}></div>
          ) : (
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                isRoundEnded
                  ? "bg-red-500"
                  : isPreStart
                  ? "bg-yellow-500"
                  : "bg-blue-500"
              }`}
              style={{
                width: `${
                  isPreStart && timeLeft !== null
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
    </div>
  );
};

export default RoundDashboard;
