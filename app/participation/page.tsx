"use client";
import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import ParticipationGrid from "../components/ParticipationGrid";
import { fetchParticipationData } from "../../utils/contract";
import LiveUpdateIndicator from "../components/LiveUpdateIndicator";

export default function ParticipationPage() {
  const { address } = useAccount();
  const [latestRound, setLatestRound] = useState<number | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participationScores, setParticipationScores] = useState<number[]>([]);
  const [trades, setTrades] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef({ participants, participationScores });
  const [dataChanged, setDataChanged] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isLoading) {
          setIsRefreshing(true);
        }

        const { latestRound, participants, participationScores, trades } =
          await fetchParticipationData();
        const hasChanged =
          JSON.stringify(participants) !==
            JSON.stringify(dataRef.current.participants) ||
          JSON.stringify(participationScores) !==
            JSON.stringify(dataRef.current.participationScores);

        dataRef.current = { participants, participationScores };

        if (hasChanged) {
          setDataChanged(true);
          setTimeout(() => setDataChanged(false), 1000);
        }

        setLatestRound(latestRound);
        setParticipants(participants);
        setParticipationScores(participationScores);
        setTrades(trades);
        setLastUpdated(new Date());
        setError(null);
      } catch (error) {
        console.error("Error fetching participation data:", error);
        setError("Failed to load participation data. Please try again later.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 5000);

    return () => clearInterval(intervalId);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto mb-6">
          <div className="h-8 bg-gray-700 rounded w-40 mx-auto mb-4"></div>

          <div className="bg-gray-800 rounded-lg p-4 flex text-center animate-pulse">
            <div className="w-1/3 flex justify-center">
              <div>
                <div className="h-5 bg-gray-700 rounded w-24 mx-auto"></div>
                <div className="h-8 bg-gray-700 rounded w-8 mx-auto mt-1"></div>
              </div>
            </div>
            <div className="w-1/3 flex justify-center">
              <div>
                <div className="h-5 bg-gray-700 rounded w-24 mx-auto"></div>
                <div className="h-8 bg-gray-700 rounded w-8 mx-auto mt-1"></div>
              </div>
            </div>
            <div className="w-1/3 flex justify-center">
              <div>
                <div className="h-5 bg-gray-700 rounded w-24 mx-auto"></div>
                <div className="h-8 bg-gray-700 rounded w-8 mx-auto mt-1"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-800 border border-gray-700 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  const counts = {
    none: participationScores.filter((score) => score === 0).length,
    partial: participationScores.filter((score) => score === 1).length,
    full: participationScores.filter((score) => score === 2).length,
  };

  return (
    <div className="container mx-auto">
      <div className="max-w-4xl mx-auto mb-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Round {latestRound}
        </h1>
        <div className="bg-gray-800 rounded-lg p-4 flex text-center">
          <div className="w-1/3 flex justify-center">
            <div>
              <div className="text-red-400 font-medium">Did not trade</div>
              <div className="text-2xl mt-1">{counts.none}</div>
            </div>
          </div>
          <div className="w-1/3 flex justify-center">
            <div>
              <div className="text-blue-400 font-medium">Traded some</div>
              <div className="text-2xl mt-1">{counts.partial}</div>
            </div>
          </div>
          <div className="w-1/3 flex justify-center">
            <div>
              <div className="text-green-400 font-medium">Sold all tokens</div>
              <div className="text-2xl mt-1">{counts.full}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div
          className={`transition-opacity duration-500 ${
            dataChanged ? "opacity-75" : "opacity-100"
          }`}
        >
          <ParticipationGrid
            participants={participants}
            participationScores={participationScores}
            trades={trades}
            me={address}
          />
        </div>

        <LiveUpdateIndicator
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          className="mt-4 px-2"
        />
      </div>
    </div>
  );
}
