"use client";

import React, { useEffect, useState, use } from "react";
import type { ChartOptions } from "chart.js";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import "react-loading-skeleton/dist/skeleton.css";
import dynamic from "next/dynamic";

const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

import { getNickname, fetchPNLData } from "../../../utils/contract";
import { useSimpleMode } from "../../components/Header";
import { pnlColor, formatNumber } from "../../../utils/helpers";
import CardLoading from "./CardLoading";

const PlayerDetails = ({
  params,
}: {
  params: Promise<{ address: string }>;
}) => {
  const unwrappedParams = use(params);
  const { address } = unwrappedParams;
  const { isSimpleMode } = useSimpleMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<{
    pnls: number[];
    trades: number[];
    nickname: string;
    rank: string;
    totalPlayers: number;
    activePlayers: number;
    totalPNL: number;
  }>({
    pnls: [],
    trades: [],
    nickname: "",
    rank: "-",
    totalPlayers: 0,
    activePlayers: 0,
    totalPNL: 0,
  });

  // Register Chart.js components on the client side only
  useEffect(() => {
    // Import and register Chart.js components
    const registerChartComponents = async () => {
      const {
        Chart,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler,
      } = await import("chart.js");

      Chart.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler
      );
    };

    registerChartComponents();
  }, []);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        setError(null);

        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "";
        if (!rpcUrl) throw new Error("RPC URL not defined");

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const peripheryAddress = process.env.NEXT_PUBLIC_peripheryAddress || "";
        const competitionAddress =
          process.env.NEXT_PUBLIC_competitionAddress || "";

        if (!peripheryAddress) throw new Error("Periphery address not defined");
        if (!competitionAddress)
          throw new Error("Competition address not defined");

        const PeripheryABI = (await import("../../../abis/Periphery.json"))
          .default;

        const peripheryContract = new ethers.Contract(
          peripheryAddress,
          PeripheryABI,
          provider
        );

        // Get player stats
        const [pnls, trades] = await peripheryContract.getStats(
          competitionAddress,
          address
        );

        // Format PNLs and trades from contract (convert from BigInt to number with proper formatting)
        const formattedPNLs = pnls.map((pnl: bigint) =>
          Number(ethers.formatEther(pnl))
        );
        const formattedTrades = trades.map((trade: bigint) => Number(trade));

        // Get all-time PNL data for ranking and nickname
        const { participants, realizedPNLs, unrealizedPNLs } =
          await fetchPNLData();

        const participantIndex = participants.findIndex(
          (participant) => participant.toLowerCase() === address.toLowerCase()
        );

        // Get player nickname
        const nickname =
          participantIndex >= 0
            ? getNickname(participantIndex)
            : "Unknown Player";

        // Calculate player's total PNL (realized + unrealized)
        let totalPNL = 0;
        if (participantIndex >= 0) {
          const realizedPNL = realizedPNLs[participantIndex] || 0;
          const unrealizedPNL = unrealizedPNLs[participantIndex] || 0;
          totalPNL = realizedPNL + unrealizedPNL;
        }

        // Calculate player's rank
        // Combine each participant with their total PNL
        const combinedPNLs = participants.map((_, i) => {
          return (realizedPNLs[i] || 0) + (unrealizedPNLs[i] || 0);
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

        setPlayerStats({
          pnls: formattedPNLs,
          trades: formattedTrades,
          nickname: nickname,
          rank: rank,
          totalPlayers: participants.length,
          activePlayers: activeParticipants,
          totalPNL: totalPNL,
        });
      } catch (error) {
        console.error("Error fetching player data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [address]);

  const cumulativePNLs = playerStats.pnls.reduce((acc: number[], pnl, idx) => {
    if (idx === 0) {
      acc.push(pnl);
    } else {
      acc.push(acc[idx - 1] + pnl);
    }
    return acc;
  }, []);

  // Determine chart colors based on total PNL
  const lineColor =
    playerStats.totalPNL >= 0 ? "rgba(34,197,94,1)" : "rgba(239,68,68,1)";
  const fillColor =
    playerStats.totalPNL >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";

  const chartData = {
    labels: playerStats.pnls.map((_, index) => `Round ${index}`),
    datasets: [
      {
        label: "Cumulative PNL",
        data: cumulativePNLs,
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return fillColor; // fallback for initial render
          const gradient = ctx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );
          if (playerStats.totalPNL >= 0) {
            gradient.addColorStop(0, "rgba(34,197,94,0.5)"); // green top
            gradient.addColorStop(1, "rgba(34,197,94,0)"); // transparent green bottom
          } else {
            gradient.addColorStop(1, "rgba(239,68,68,0.5)"); // red top
            gradient.addColorStop(0, "rgba(239,68,68,0)"); // transparent red bottom
          }
          return gradient;
        },
        borderColor: lineColor,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 7,
        pointHitRadius: 70,
        pointBackgroundColor: lineColor,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: lineColor,
        tension: 0.1,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        backgroundColor: "rgba(31, 41, 55, 0.9)",
        padding: 8,
        cornerRadius: 6,
        callbacks: {
          label: function (context: any) {
            return formatNumber(context.parsed.y);
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: true,
    },
    scales: {
      y: {
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      x: {
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  // Calculate statistics
  const totalTrades = playerStats.trades.reduce(
    (sum, trades) => sum + trades,
    0
  );

  const etherscanUrl = `${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/address/${address}`;

  // No references to roundPNLData remain; all logic uses fetchPNLData output.

  return (
    <div className="container mx-auto p-4 text-white">
      {error ? (
        <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg mb-6">
          <p className="text-white">{error}</p>
        </div>
      ) : loading ? (
        <CardLoading />
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Sleek Player Card - Robinhood Style */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-xl overflow-hidden transform transition-transform duration-300 ease-in-out hover:scale-103">
            {/* Header with player info and total PNL */}
            <div className="p-6 pb-0">
              <div className="flex justify-between items-baseline">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {playerStats.nickname}
                  </h1>
                </div>

                <div className="flex items-baseline">
                  <span
                    className={`text-3xl font-bold ${pnlColor(
                      playerStats.totalPNL
                    )}`}
                  >
                    {playerStats.totalPNL > 0 ? "+$" : "-$"}
                    {formatNumber(Math.abs(playerStats.totalPNL))}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <div>
                  {playerStats.rank !== "-" && (
                    <span>
                      Rank #{playerStats.rank} of {playerStats.activePlayers}
                    </span>
                  )}
                  {playerStats.rank === "-" && <span>Unranked</span>}
                </div>
                <div className="flex items-center gap-1">
                  {!isSimpleMode && etherscanUrl && (
                    <a
                      href={etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-300 transition"
                    >
                      {totalTrades} trades
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </a>
                  )}
                  {isSimpleMode && <span>{totalTrades} trades</span>}
                </div>
              </div>
            </div>

            {/* Prominent Chart Section */}
            <div className="p-4">
              <div className="h-80">
                {playerStats.pnls.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No PNL history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDetails;
