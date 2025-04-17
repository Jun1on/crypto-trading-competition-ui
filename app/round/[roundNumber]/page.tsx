"use client";
import React, { useState, useEffect, use } from "react";
import Leaderboard from "../../components/Leaderboard";
import RoundDashboard from "../../components/RoundDashboard";
import PlayerDashboard from "../../components/PlayerDashboard";
import { useAccount } from "wagmi";
import {
  fetchLatestRoundPNL,
  getLatestRoundDetails,
} from "../../../utils/contract";

export default function Home({
  params,
}: {
  params: Promise<{ roundNumber: number }>;
}) {
  const unwrappedParams = use(params);
  const { roundNumber } = unwrappedParams;
  const { address } = useAccount();
  const [pnlData, setPnlData] = useState({
    latestRound: 0,
    participants: [],
    realizedPNLs: [],
    unrealizedPNLs: [],
    mmRealized: 0,
    mmUnrealized: 0,
  });
  const [roundDetails, setRoundDetails] = useState({
    currentRound: 0,
    tokenAddress: null,
    tokenName: "",
    tokenSymbol: "",
    startTime: 0,
    endTime: 0,
    airdropAmount: 0,
    USDM: "",
    usdmBalance: 0,
    tokenBalance: 0,
    userTrades: 0,
  });
  const [loading, setLoading] = useState(true);
  const [roundLoading, setRoundLoading] = useState(true);

  const fetchRoundInfo = async () => {
    try {
      // Get player-specific details if connected, otherwise get general info
      const details = await getLatestRoundDetails(
        address || undefined,
        roundNumber
      );

      setRoundDetails({
        currentRound: roundNumber,
        tokenAddress: details.token,
        tokenName: details.name,
        tokenSymbol: details.symbol,
        startTime: details.startTimestamp,
        endTime: details.endTimestamp,
        airdropAmount: details.airdropPerParticipantUSDM,
        USDM: details.USDM,
        // Include the new fields from the enhanced API
        usdmBalance: details.usdmBalance || 0,
        tokenBalance: details.tokenBalance || 0,
        userTrades: details.trades || 0,
      });
    } catch (error) {
      console.error("Error fetching round info:", error);
    } finally {
      setRoundLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchLatestRoundPNL(roundNumber);
        setPnlData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchRoundInfo();
  }, [loading]);

  return (
    <div className="container mx-auto">
      <div className={`flex flex-wrap gap-2 mb-6 justify-center ${loading ? 'invisible' : ''}`}>
        {[...Array(pnlData.latestRound + 1).keys()].map((num) => (
          num == roundNumber ? (
            <span
              key={num}
              className={
                'px-3 py-1 rounded font-medium border transition-all duration-150 bg-blue-600 text-white border-blue-700 shadow-lg scale-105 cursor-default'
              }
              aria-current="page"
            >
              {num}
            </span>
          ) : (
            <a
              key={num}
              href={`/round/${num}`}
              className={
                'px-3 py-1 rounded font-medium border transition-all duration-150 bg-gray-800 text-gray-200 border-gray-700 hover:bg-blue-700 hover:text-white'
              }
            >
              {num}
            </a>
          )
        ))}
      </div>
      <RoundDashboard roundDetails={roundDetails} loading={roundLoading} />

      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="bg-gray-700 py-3">
              <div className="flex space-x-4 px-4">
                <div className="h-6 bg-gray-600 rounded w-12"></div>
                <div className="h-6 bg-gray-600 rounded w-24"></div>
                <div className="ml-auto h-6 bg-gray-600 rounded w-24"></div>
                <div className="h-6 bg-gray-600 rounded w-24"></div>
                <div className="h-6 bg-gray-600 rounded w-24"></div>
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex space-x-4 px-4 py-4 border-b border-gray-700"
              >
                <div className="h-5 bg-gray-600 rounded w-8"></div>
                <div className="h-5 bg-gray-600 rounded w-32"></div>
                <div className="ml-auto h-5 bg-gray-600 rounded w-20"></div>
                <div className="h-5 bg-gray-600 rounded w-20"></div>
                <div className="h-5 bg-gray-600 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <Leaderboard
              participants={pnlData.participants}
              realizedPNLs={pnlData.realizedPNLs}
              unrealizedPNLs={pnlData.unrealizedPNLs}
              mmRealized={pnlData.mmRealized}
              mmUnrealized={pnlData.mmUnrealized}
              me={address}
              currentRoundToken={roundDetails.tokenAddress}
            />
          </>
        )}
      </div>
    </div>
  );
}
