"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Skeleton from "react-loading-skeleton";
import { getNickname } from "../../utils/contract";
import { useSimpleMode } from "./Header";
import Link from "next/link";
import { pnlColor, formatNumber } from "../../utils/helpers";

type PlayerDashboardProps = {
  roundDetails: {
    currentRound: number;
    tokenAddress: string | null;
    tokenName: string;
    tokenSymbol: string;
    startTime: number;
    endTime: number;
    airdropAmount: number;
    USDM: string;
    usdmBalance: number;
    tokenBalance: number;
    userTrades: number;
  };
  pnlData: {
    latestRound: number;
    participants: string[];
    realizedPNLs: number[];
    unrealizedPNLs: number[];
    mmRealized: number;
    mmUnrealized: number;
  };
  loading: boolean;
};

const PlayerDashboard = ({
  roundDetails,
  pnlData,
  loading,
}: PlayerDashboardProps) => {
  const { isSimpleMode } = useSimpleMode();
  const { address } = useAccount();
  const [playerData, setPlayerData] = useState({
    index: -1,
    realizedPNL: 0,
    unrealizedPNL: 0,
    totalPNL: 0,
    trades: 0,
    rank: "", // Change to string type to match the "-" value for unranked players
    nickname: "",
    isRegistered: false,
    activeParticipants: 0,
  });

  const skeletonBaseColor = "#2d3748";
  const skeletonHighlightColor = "#4a5568";

  useEffect(() => {
    // Get player index and data
    const calculatePlayerData = () => {
      if (!address || !pnlData.participants.length) return;

      const index = pnlData.participants.findIndex(
        (participant) => participant.toLowerCase() === address.toLowerCase()
      );

      const isRegistered = index !== -1;

      // If player is not registered, set minimal data
      if (!isRegistered) {
        setPlayerData({
          index: -1,
          realizedPNL: 0,
          unrealizedPNL: 0,
          totalPNL: 0,
          trades: 0,
          rank: "", // Changed to string type to match the rank state type
          nickname: "",
          isRegistered: false,
          activeParticipants: 0,
        });
        return;
      }

      // Calculate total PNL and rank
      const realizedPNL = pnlData.realizedPNLs[index] || 0;
      const unrealizedPNL = pnlData.unrealizedPNLs[index] || 0;
      const totalPNL = realizedPNL + unrealizedPNL;
      const nickname = getNickname(index);

      // Get trades count - prioritize userTrades from roundDetails if available
      let trades = 0;

      // First check if we have userTrades from new API
      if (roundDetails.userTrades > 0) {
        trades = roundDetails.userTrades;
      }

      // Calculate ranking by creating a list of all PNLs (excluding 0 values) and finding position
      // First, combine each participant with their total PNL
      const combinedPNLs = pnlData.participants.map((_, i) => {
        return (
          (pnlData.realizedPNLs[i] || 0) + (pnlData.unrealizedPNLs[i] || 0)
        );
      });

      // Filter to only active participants (those with non-zero total PNL)
      const activePNLs = combinedPNLs.filter((pnl) => pnl !== 0);
      const activeParticipants = activePNLs.length;

      // Sort active PNLs in descending order for rank calculation
      const sortedActivePNLs = [...activePNLs].sort((a, b) => b - a);

      // Calculate rank among active participants only
      const rank =
        totalPNL === 0
          ? "-"
          : (sortedActivePNLs.indexOf(totalPNL) + 1).toString();

      setPlayerData({
        index,
        realizedPNL,
        unrealizedPNL,
        totalPNL,
        trades,
        rank,
        nickname,
        isRegistered: true,
        activeParticipants,
      });
    };

    if (!loading) {
      calculatePlayerData();
    }
  }, [address, loading, pnlData, roundDetails]);

  if (!address) {
    return (
      <div className="bg-gray-800 to-gray-900 mx-auto rounded-lg shadow-lg p-6 mb-5 max-w-4xl">
        <div className="text-center text-gray-400">
          Please connect your wallet to view your dashboard
        </div>
      </div>
    );
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const etherscanBaseUrl =
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ||
    "https://sepolia.etherscan.io";
  const playerEtherscanUrl = `${etherscanBaseUrl}/address/${address}`;
  const playerTokenTxUrl = roundDetails.tokenAddress
    ? `https://dexscreener.com/optimism/${roundDetails.tokenAddress}?maker=${address}`
    : playerEtherscanUrl;

  return (
    <div className="bg-gray-800 mx-auto rounded-lg shadow-lg p-6 mb-5 max-w-4xl">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          {!loading && playerData.isRegistered
            ? playerData.nickname
            : "Your Dashboard"}
        </h2>
        <div className="flex items-center gap-4">
          {!isSimpleMode && (
            <a
              href={playerEtherscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors duration-150 ease-in-out"
              title="View on Etherscan"
            >
              <span>Etherscan</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </a>
          )}
          <Link
            href={`/player/${address}`}
            target="_blank"
            className="flex items-center gap-1 text-gray-300 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 hover:text-transparent hover:bg-clip-text transition-all duration-150 ease-out transform hover:scale-105"
            title="Player Card"
          >
            <span>Player Card</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {!loading && !playerData.isRegistered && (
        <div className="bg-yellow-800 bg-opacity-50 text-yellow-200 p-4 rounded-lg mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <p>
            You are not registered. Please ask an exec member to register you
            right now.
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
              <Skeleton
                height={24}
                width={120}
                baseColor={skeletonBaseColor}
                highlightColor={skeletonHighlightColor}
              />
              <Skeleton
                height={32}
                width={150}
                baseColor={skeletonBaseColor}
                highlightColor={skeletonHighlightColor}
                className="mt-2"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PNL Stats */}
          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
            <div className="text-gray-400 text-sm">
              {isSimpleMode ? "Profit 'n Loss (PNL)" : "PNL"}
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${pnlColor(
                playerData.totalPNL
              )}`}
            >
              {playerData.totalPNL > 0 ? "+" : ""}
              {formatNumber(playerData.totalPNL)} USDM
            </div>
            {!isSimpleMode && (
              <div className="flex justify-between mt-2 text-xs">
                <div>
                  <span className="text-gray-400">Realized </span>
                  <br />

                  <span className={pnlColor(playerData.realizedPNL)}>
                    {playerData.realizedPNL > 0 ? "+" : ""}
                    {formatNumber(playerData.realizedPNL)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Unrealized </span>
                  <br />
                  <span className={pnlColor(playerData.unrealizedPNL)}>
                    {playerData.unrealizedPNL > 0 ? "+" : ""}
                    {formatNumber(playerData.unrealizedPNL)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
            <div className="flex flex-col mt-1">
              <div className="flex justify-between">
                <span className="text-gray-300">USDM</span>
                <span className="text-white font-medium">
                  {formatNumber(roundDetails.usdmBalance)}
                </span>
              </div>
              {roundDetails.tokenSymbol && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-300">
                    {roundDetails.tokenSymbol}
                  </span>
                  <span className="text-white font-medium">
                    {formatNumber(roundDetails.tokenBalance)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              each player got{" "}
              <span className="text-white">
                {formatNumber(roundDetails.airdropAmount)} USDM
              </span>{" "}
              for free this round
            </div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Rank</div>
            {playerData.rank === "-" ? (
              <>
                <div className="text-2xl font-bold mt-1 text-white">
                  unranked
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  make your first trade!
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold mt-1 text-white">
                #{playerData.rank}
                <span className="text-gray-400 text-sm ml-1">
                  out of {playerData.activeParticipants}
                </span>
              </div>
            )}
          </div>

          <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
            {isSimpleMode ? (
              <>
                <div className="text-gray-400 text-sm">Your Trades</div>
                <div className="text-2xl font-bold mt-1 text-white flex items-center justify-between">
                  <span>{playerData.trades}</span>
                </div>
              </>
            ) : (
              <>
                <a
                  href={playerTokenTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-start text-white hover:text-gray-300"
                  title="View trades"
                >
                  <div className="flex items-center gap-1">
                    <div className="text-gray-400 text-sm">Your Trades</div>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold mt-1 flex items-center gap-2">
                    <span>{playerData.trades}</span>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
