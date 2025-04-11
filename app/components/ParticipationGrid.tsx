"use client";
import React from "react";
import Link from "next/link";
import { getNickname } from "../../utils/contract";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface ParticipationGridProps {
  participants: string[];
  participationScores: number[];
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
  me,
}) => {
  if (participants.length !== participationScores.length) {
    return <div>Data mismatch</div>;
  }

  // Map participants to structured data
  const participationData = participants.map((player, index) => {
    const score = participationScores[index];
    const nickname = getNickname(index);

    return {
      player,
      nickname,
      score,
    };
  });

  // Sort the participation data alphabetically by nickname (ignoring case)
  const sortedParticipationData = [...participationData].sort((a, b) =>
    a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase())
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
                  <h3
                    className={`font-medium ${
                      isMe ? "text-orange-400" : "text-white"
                    }`}
                  >
                    {entry.nickname}
                  </h3>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
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
