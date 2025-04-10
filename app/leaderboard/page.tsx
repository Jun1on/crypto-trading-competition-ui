"use client";
import { useState, useEffect, useRef } from "react";
import Leaderboard from "../components/Leaderboard";
import { fetchPNLData } from "../../utils/contract";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAccount } from "wagmi";

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [participants, setParticipants] = useState<string[]>([]);
  const [realizedPNLs, setRealizedPNLs] = useState<number[]>([]);
  const [unrealizedPNLs, setUnrealizedPNLs] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if data has actually changed
  const dataRef = useRef({ participants, realizedPNLs, unrealizedPNLs });
  const [dataChanged, setDataChanged] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsRefreshing(true);

        const { participants, realizedPNLs, unrealizedPNLs } =
          await fetchPNLData();

        const hasChanged =
          JSON.stringify(participants) !==
            JSON.stringify(dataRef.current.participants) ||
          JSON.stringify(realizedPNLs) !==
            JSON.stringify(dataRef.current.realizedPNLs) ||
          JSON.stringify(unrealizedPNLs) !==
            JSON.stringify(dataRef.current.unrealizedPNLs);

        dataRef.current = { participants, realizedPNLs, unrealizedPNLs };

        if (hasChanged) {
          setDataChanged(true);
          setTimeout(() => setDataChanged(false), 1000);
        }

        setParticipants(participants);
        setRealizedPNLs(realizedPNLs);
        setUnrealizedPNLs(unrealizedPNLs);
        setLastUpdated(new Date());
        setError(null);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setError("Failed to load leaderboard data. Please try again later.");
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 4000);

    return () => clearInterval(intervalId);
  }, []);

  if (error && participants.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
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
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Leaderboard
          participants={participants}
          realizedPNLs={realizedPNLs}
          unrealizedPNLs={unrealizedPNLs}
          me={address}
        />

        <div className="mt-4 flex justify-between items-center text-xs text-gray-500 px-2">
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 transition-colors duration-700 ease-in-out ${
                isRefreshing ? "bg-blue-500 animate-pulse" : "bg-green-500"
              }`}
            ></div>
            <span>Updating live</span>
          </div>

          {lastUpdated && (
            <div className="flex items-center">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <ArrowPathIcon
                className={`ml-2 w-3 h-3 ${
                  isRefreshing ? "animate-spin text-blue-500" : "text-gray-500"
                }`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
