"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import dynamic from "next/dynamic";

import { useSimpleMode } from "../../components/Header";
import { getNickname, fetchPNLData } from "../../../utils/contract";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { formatNumber, pnlColor } from "../../../utils/helpers";

if (typeof window !== "undefined") {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
}

const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), {
  ssr: false,
});

const PlayerDetails = ({ address }: { address: string }) => {
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

  // State and ref for 3D hover effect
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        setError(null);

        const competitionAddress =
          process.env.NEXT_PUBLIC_competitionAddress || "";
        const { pnls: formattedPNLs, trades: formattedTrades } = await (
          await import("../../../utils/contract")
        ).getStats(competitionAddress, address);

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

  // 3D Hover Effect Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element.
    const y = e.clientY - rect.top; // y position within the element.

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((centerY - y) / centerY) * 3;
    const rotateY = ((x - centerX) / centerX) * 3;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    // Reset rotation when mouse leaves
    setRotate({ x: 0, y: 0 });
  };

  // Dynamic style for the card
  const cardStyle = {
    transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(1.03)`,
    transition: "transform 0.1s ease-out",
  };

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
          console.log("[Chart backgroundColor] context:", context);
          const chart = context.chart;
          console.log("[Chart backgroundColor] chart:", chart);
          const { ctx, chartArea } = chart;
          console.log("[Chart backgroundColor] chartArea:", chartArea);
          if (!chartArea) {
            console.warn(
              "[Chart backgroundColor] chartArea is undefined, returning fillColor"
            );
            return fillColor; // fallback for initial render
          }
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
      ) : (
        <div className="max-w-2xl mx-auto" style={{ perspective: "1000px" }}>
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={cardStyle}
            className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 pb-0">
              <div className="flex justify-between items-baseline">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {loading ? (
                      <span className="inline-block h-7 w-36 bg-gray-700 rounded animate-pulse" />
                    ) : (
                      playerStats.nickname
                    )}
                  </h1>
                </div>

                <div className="flex items-baseline">
                  <span
                    className={`text-3xl font-bold ${pnlColor(
                      playerStats.totalPNL
                    )}`}
                  >
                    {loading ? (
                      <span className="inline-block h-8 w-24 bg-gray-700 rounded animate-pulse" />
                    ) : (
                      <>
                        {playerStats.totalPNL >= 0 ? "+$" : "-$"}
                        {formatNumber(Math.abs(playerStats.totalPNL))}
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <div>
                  {loading ? (
                    <span className="inline-block h-5 w-24 bg-gray-700 rounded animate-pulse" />
                  ) : playerStats.rank !== "-" ? (
                    <span>
                      Rank #{playerStats.rank} of {playerStats.activePlayers}
                    </span>
                  ) : (
                    <span>Unranked</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {loading ? (
                    <span className="inline-block h-5 w-16 bg-gray-700 rounded animate-pulse" />
                  ) : !isSimpleMode ? (
                    <a
                      href={etherscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-300 transition"
                    >
                      {totalTrades} trades
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </a>
                  ) : (
                    <span>{totalTrades} trades</span>
                  )}
                </div>
              </div>
            </div>

            {/* Prominent Chart Section */}
            <div className="p-4">
              <div className="h-80">
                {!loading && <Line data={chartData} options={chartOptions} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerDetails;
