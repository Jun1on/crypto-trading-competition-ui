"use client";
import React from "react";
import Link from "next/link";
import { getNickname } from "../../utils/contract";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface LeaderboardEntry {
  player: string;
  nickname: string;
  realizedPNL: number;
  unrealizedPNL: number;
  totalPNL: number;
}

interface LeaderboardProps {
  participants: string[];
  realizedPNLs: number[];
  unrealizedPNLs: number[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  participants = [],
  realizedPNLs = [],
  unrealizedPNLs = [],
}) => {
  if (
    participants.length !== realizedPNLs.length ||
    participants.length !== unrealizedPNLs.length
  ) {
    return <div>Data mismatch</div>;
  }

  const leaderboardData = participants
    .map((player, index) => {
      const realizedPNL = realizedPNLs[index];
      const unrealizedPNL = unrealizedPNLs[index];
      const totalPNL = realizedPNL + unrealizedPNL;
      const nickname = getNickname(index);

      return {
        player,
        nickname,
        realizedPNL,
        unrealizedPNL,
        totalPNL,
      };
    })
    .filter((entry) => entry.totalPNL !== 0)
    .sort((a, b) => b.totalPNL - a.totalPNL);

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="overflow-auto shadow-md rounded-lg">
        <Table className="min-w-full bg-gray-800 text-white">
          <thead className="sticky top-0 bg-gray-700">
            <tr>
              <th className="w-12 p-2 text-center text-white font-medium">
                Rank
              </th>
              <th className="p-2 text-left text-white font-medium">Player</th>
              <th className="p-2 text-right text-white font-medium">
                Realized PNL
              </th>
              <th className="p-2 text-right text-white font-medium">
                Unrealized PNL
              </th>
              <th className="p-2 text-right text-white font-medium">
                Total PNL
              </th>
            </tr>
          </thead>
          <TableBody>
            {leaderboardData.map((entry, index) => (
              <TableRow
                key={index}
                className={`border-b border-gray-700 hover:bg-gray-700`}
              >
                <TableCell className="p-2 text-center">
                  {(index + 1).toString().padStart(3, "0")}
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center">
                    <Link href={`/player/${entry.player}`}>
                      <span className="flex items-center text-white hover:underline">
                        <span>{entry.nickname}</span>
                        <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1 text-gray-400" />
                      </span>
                    </Link>
                  </div>
                </TableCell>
                <TableCell
                  className={`p-2 text-right ${
                    entry.realizedPNL < 0
                      ? "text-red-400"
                      : entry.realizedPNL > 0
                      ? "text-green-400"
                      : "text-gray-400"
                  }`}
                >
                  {entry.realizedPNL.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`p-4 text-right ${
                    entry.unrealizedPNL < 0
                      ? "text-red-400"
                      : entry.unrealizedPNL > 0
                      ? "text-green-400"
                      : "text-gray-400"
                  }`}
                >
                  {entry.unrealizedPNL.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`p-4 text-right ${
                    entry.totalPNL < 0
                      ? "text-red-400"
                      : entry.totalPNL > 0
                      ? "text-green-400"
                      : "text-gray-400"
                  }`}
                >
                  {entry.totalPNL.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Leaderboard;
