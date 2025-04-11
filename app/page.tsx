"use client";
import { useState, useEffect } from "react";
import Leaderboard from "./components/Leaderboard";
import RoundDashboard from "./components/RoundDashboard";
import LiveUpdateIndicator from "./components/LiveUpdateIndicator";
import { useAccount } from "wagmi";
import { fetchLatestRoundPNL } from "../utils/contract";

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
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [loading]);

  return (
    <div className="container mx-auto">
      <RoundDashboard />

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
