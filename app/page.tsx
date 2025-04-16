"use client";
import React, { useState, useEffect } from "react";
import Leaderboard from "./components/Leaderboard";
import RoundDashboard from "./components/RoundDashboard.tsx";
import PlayerDashboard from "./components/PlayerDashboard";
import LiveUpdateIndicator from "./components/LiveUpdateIndicator";
import { useAccount } from "wagmi";
import { fetchLatestRoundPNL, getLatestRoundDetails, fetchParticipationData } from "../utils/contract";

const REFRESH_INTERVAL = 5000;

export default function Home() {
  const { address } = useAccount();
  const [pnlData, setPnlData] = useState({
    latestRound: 0,
    participants: [],
    realizedPNLs: [],
    unrealizedPNLs: [],
    mmRealized: 0,
    mmUnrealized: 0,
  });
  const [participationData, setParticipationData] = useState({
    latestRound: 0 as number | null,
    participants: [] as string[],
    participationScores: [] as number[],
    trades: [] as number[],
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
  });
  const [loading, setLoading] = useState(true);
  const [roundLoading, setRoundLoading] = useState(true);
  const [participationLoading, setParticipationLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      setRoundLoading(false);
    }
  };

  const fetchTradeData = async () => {
    try {
      const data = await fetchParticipationData();
      
      // Ensure we're setting all required properties with the correct types
      setParticipationData({
        latestRound: data.latestRound,
        participants: Array.isArray(data.participants) ? data.participants : [],
        participationScores: Array.isArray(data.participationScores) ? data.participationScores : [],
        trades: Array.isArray(data.trades) ? data.trades : [],
      });
    } catch (error) {
      console.error("Error fetching participation data:", error);
    } finally {
      setParticipationLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!loading) {
          setIsRefreshing(true);
        }

        const data = await fetchLatestRoundPNL();
        setPnlData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
    fetchRoundInfo();
    fetchTradeData();

    const dataIntervalId = setInterval(fetchData, REFRESH_INTERVAL);
    const roundIntervalId = setInterval(fetchRoundInfo, REFRESH_INTERVAL);
    const tradeIntervalId = setInterval(fetchTradeData, REFRESH_INTERVAL);
    
    return () => {
      clearInterval(dataIntervalId);
      clearInterval(roundIntervalId);
      clearInterval(tradeIntervalId);
    };
  }, [loading]);

  return (
    <div className="container mx-auto">
      <RoundDashboard roundDetails={roundDetails} loading={roundLoading} />

      {!loading && (
        <PlayerDashboard 
          roundDetails={roundDetails} 
          pnlData={pnlData} 
          participationData={participationData}
          loading={loading || roundLoading || participationLoading} 
        />
      )}

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
            />

            <LiveUpdateIndicator
              isRefreshing={isRefreshing}
              lastUpdated={lastUpdated}
              className="mt-4 px-2"
            />
          </>
        )}
      </div>
    </div>
  );
}
