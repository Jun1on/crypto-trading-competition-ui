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
import { useSimpleMode } from "./Header";
import ExtendedChartDropdown from "./ExtendedChartDropdown";
import RoundTimer from "./RoundTimer";

const REFRESH_INTERVAL = 5000;

const RoundDashboard = () => {
  const { isSimpleMode } = useSimpleMode();
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

  const skeletonBaseColor = "#2d3748";
  const skeletonHighlightColor = "#4a5568";

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

  // Timer effect: update only timeLeft and progress
  useEffect(() => {
    if (loading || roundDetails.startTime === 0 || roundDetails.endTime === 0) {
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

      if (now < startTime) {
        setTimeLeft(startTime - now);
        setProgress(0);
        return true;
      }

      if (totalDuration <= 0 || remaining <= 0) {
        setTimeLeft(0);
        setProgress(100);
        return null;
      } else {
        setTimeLeft(remaining);
        setProgress(
          Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
        );
        return true;
      }
    };

    const shouldContinue = calculateTime();
    if (!shouldContinue) return;
    const timerInterval = setInterval(() => {
      if (!calculateTime()) {
        clearInterval(timerInterval);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [roundDetails, loading]);

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

  // Compute derived values on render based on current time
  const now = Math.floor(Date.now() / 1000);
  const isPreStart = !loading && roundDetails.startTime > now;
  const isRoundEnded = !loading && roundDetails.endTime <= now;

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 mx-auto rounded-lg shadow-lg p-10 pb-3 mb-5 max-w-4xl relative">
      <div className="flex flex-col items-center text-white gap-4">
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

        <div className="flex items-center text-sm text-gray-400">
          {loading ? (
            <div className="py-2">
              <Skeleton
                width={350}
                height={20}
                baseColor={skeletonBaseColor}
                highlightColor={skeletonHighlightColor}
              />
            </div>
          ) : (
            <>
              {!isSimpleMode && (
                <>
                  {!isSimpleMode && (
                    <button
                      onClick={handleCopy}
                      className="ml-2 p-1 flex items-center hover:text-gray-300 transition-colors cursor-pointer"
                      title="Copy address"
                    >
                      <span className="font-mono">{truncatedAddress}</span>
                      <DocumentDuplicateIcon className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </>
              )}

              {roundDetails.tokenAddress &&
                roundDetails.tokenAddress !== ethers.ZeroAddress && (
                  <ExtendedChartDropdown
                    roundDetails={roundDetails}
                    isPreStart={isPreStart}
                    isSimpleMode={isSimpleMode}
                  />
                )}

              {roundDetails.tokenAddress &&
                roundDetails.tokenAddress !== ethers.ZeroAddress && (
                  <a
                    href="/swap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center text-blue-400 hover:text-blue-300 transition-colors px-3 py-2 text-base font-medium ml-2 ${
                      isRoundEnded || isPreStart ? "opacity-70" : ""
                    }`}
                    title={
                      isRoundEnded ? "Round has ended" : "Trade on Uniswap"
                    }
                  >
                    <ArrowsRightLeftIcon className="w-5 h-5 mr-2" />
                    <span>Trade</span>
                  </a>
                )}

              {!isSimpleMode &&
                roundDetails.tokenAddress &&
                roundDetails.tokenAddress !== ethers.ZeroAddress && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/token/${roundDetails.tokenAddress}#balances`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 flex items-center text-blue-400 hover:text-blue-300 transition-colors px-3 py-2 text-base font-medium"
                    title="View Holders on Etherscan"
                  >
                    <span>Holders</span>
                  </a>
                )}
            </>
          )}
        </div>
      </div>
      <Toaster />

      <RoundTimer
        loading={loading}
        isRoundEnded={isRoundEnded}
        isPreStart={isPreStart}
        timeLeft={timeLeft}
        progress={progress}
        skeletonBaseColor={skeletonBaseColor}
        skeletonHighlightColor={skeletonHighlightColor}
      />

      {/* This progress bar is now redundant if it's part of RoundTimer,
          but if you want to keep it separately you can compute using the same derived values */}
    </div>
  );
};

export default RoundDashboard;
