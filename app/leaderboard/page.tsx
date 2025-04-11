"use client";
import { useState, useEffect } from "react";
import Leaderboard from "../components/Leaderboard";
import { fetchPNLData } from "../../utils/contract";
import { useAccount } from "wagmi";
import LiveUpdateIndicator from "../components/LiveUpdateIndicator";

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [participants, setParticipants] = useState<string[]>([]);
  const [realizedPNLs, setRealizedPNLs] = useState<number[]>([]);
  const [unrealizedPNLs, setUnrealizedPNLs] = useState<number[]>([]);
  const [mmRealized, setMmRealized] = useState<number>(0);
  const [mmUnrealized, setMmUnrealized] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isLoading) {
          setIsRefreshing(true);
        }

        const {
          participants,
          realizedPNLs,
          unrealizedPNLs,
          mmRealized,
          mmUnrealized,
        } = await fetchPNLData();

        // Update state with new values
        setParticipants(participants);
        setRealizedPNLs(realizedPNLs);
        setUnrealizedPNLs(unrealizedPNLs);
        setMmRealized(mmRealized);
        setMmUnrealized(mmUnrealized);
        setLastUpdated(new Date());
        setError(null);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setError("Failed to load leaderboard data. Please try again later.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 4000);

    return () => clearInterval(intervalId);
  }, [isLoading]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-700 py-3">
            <div className="animate-pulse flex space-x-4 px-4">
              <div className="h-6 bg-gray-600 rounded w-12"></div>
              <div className="h-6 bg-gray-600 rounded w-24"></div>
              <div className="ml-auto h-6 bg-gray-600 rounded w-24"></div>
              <div className="h-6 bg-gray-600 rounded w-24"></div>
              <div className="h-6 bg-gray-600 rounded w-24"></div>
            </div>
          </div>
          <div className="animate-pulse">
            {[...Array(10)].map((_, i) => (
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
        </div>
      </div>
    );
  }

  if (error && participants.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="bg-gray-800 rounded-lg p-8 text-center text-red-400">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="max-w-4xl mx-auto">
        <Leaderboard
          participants={participants}
          realizedPNLs={realizedPNLs}
          unrealizedPNLs={unrealizedPNLs}
          mmRealized={mmRealized}
          mmUnrealized={mmUnrealized}
          me={address}
        />

        <LiveUpdateIndicator
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          className="mt-4 px-2"
        />
      </div>
    </div>
  );
}
