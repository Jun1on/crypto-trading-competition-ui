"use client";
import React, { useEffect, useState } from "react";
import {
  getCurrentRound,
  getPlayerPNLHistory,
  getNonce,
} from "../../../utils/contract";
import { ethers } from "ethers";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PlayerDetails = ({ params }: { params: Promise<{ slug: string }> }) => {
  const address = params.slug;
  const [history, setHistory] = useState([]);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (address) {
      const fetchData = async () => {
        try {
          const currentRound = await getCurrentRound();
          const historyData = await getPlayerPNLHistory(address, currentRound);
          setHistory(
            historyData.map((pnl) => parseFloat(ethers.formatEther(pnl)))
          );
          const nonceData = await getNonce(address);
          setNonce(nonceData);
        } catch (error) {
          console.error("Error fetching player data:", error);
        }
      };
      fetchData();
    }
  }, [address]);

  const chartData = {
    labels: history.map((_, index) => `Round ${index}`),
    datasets: [
      {
        label: "Realized PNL (USDM)",
        data: history,
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "PNL (USDM)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Round",
        },
      },
    },
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        Player Details: {address?.slice(0, 6) + "..." + address?.slice(-4)}
      </h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">PNL History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 text-left">Round</th>
                <th className="py-3 px-4 text-left">Realized PNL (USDM)</th>
              </tr>
            </thead>
            <tbody>
              {history.map((pnl, index) => (
                <tr key={index} className="border-b hover:bg-gray-100">
                  <td className="py-3 px-4">{index}</td>
                  <td
                    className={`py-3 px-4 ${
                      pnl < 0 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">PNL Graph</h2>
        <div className="bg-white p-4 shadow-md rounded-lg">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">
          Transaction Count (Nonce)
        </h2>
        <p className="text-lg">{nonce}</p>
      </div>
    </div>
  );
};

export default PlayerDetails;
