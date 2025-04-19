"use client";
import React from "react";
import Link from "next/link";
import { getPerson } from "../../utils/contract";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface ParticipationGridProps {
  participants: string[];
  participationScores: number[];
  trades: number[];
  me?: string; // Optional prop for current user's address
}

// Determine color based on participation score
const getParticipationColor = (score: number) => {
  switch (score) {
    case 0:
      return "bg-red-900/40 border-red-800 hover:bg-red-900/60";
    case 1:
      return "bg-blue-900/40 border-blue-800 hover:bg-blue-900/60";
    case 2:
      return "bg-green-900/40 border-green-800 hover:bg-green-900/60";
    default:
      return "bg-gray-800 border-gray-700 hover:bg-gray-700";
  }
};

const ParticipationGrid: React.FC<ParticipationGridProps> = ({
  participants = [],
  participationScores = [],
  trades = [],
  me,
}) => {
  if (
    participants.length === 0 ||
    participants.length !== participationScores.length ||
    participants.length !== trades.length
  ) {
    return <div>Data mismatch</div>;
  }

  // Map participants to structured data
  const participationData = participants.map((player, index) => {
    const score = participationScores[index];
    const tradeCount = trades[index];
    const person = getPerson(index);

    return {
      player,
      person,
      score,
      tradeCount,
    };
  });

  // Sort the participation data alphabetically by nickname (ignoring case)
  const sortedParticipationData = [...participationData].sort((a, b) =>
    a.person[1].toLowerCase().localeCompare(b.person[1].toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedParticipationData.map((entry, index) => {
          const isMe = me && me.toLowerCase() === entry.player.toLowerCase();
          const colorClass = getParticipationColor(entry.score);

          return (
            <Link
              key={index}
              href={`${process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL}/address/${entry.player}`}
              className={`
                p-4 rounded-lg border ${colorClass} transition-colors
                ${isMe ? "ring-2 ring-orange-500" : ""}
              `}
              target="_blank"
            >
              <div className="flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col items-start">
                    <h3
                      className={`font-medium truncate max-w-[80%] ${
                        isMe ? "text-orange-400" : "text-white"
                      }`}
                    >
                      {entry.person[0]}
                    </h3>
                    <h2 className="text-gray-400 text-xs">{entry.person[1]}</h2>
                    <h2 className="text-gray-400 text-xs">{entry.person[2]}</h2>
                  </div>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {entry.tradeCount}{" "}
                  {entry.tradeCount === 1 ? "trade" : "trades"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ParticipationGrid;
