"use client";
import React from "react";
import Link from "next/link";
import { getNickname } from "../../utils/contract";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import {
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface LeaderboardProps {
  participants: string[];
  realizedPNLs: number[];
  unrealizedPNLs: number[];
  mmRealized: number;
  mmUnrealized: number;
  me?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  participants = [],
  realizedPNLs = [],
  unrealizedPNLs = [],
  mmRealized = 0,
  mmUnrealized = 0,
  me,
}) => {
  if (
    participants.length !== realizedPNLs.length ||
    participants.length !== unrealizedPNLs.length
  ) {
    return <div>Data mismatch</div>;
  }

  // Create regular player data
  const playerData = participants
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
        isMarketMaker: false,
      };
    })
    .filter((entry) => entry.totalPNL !== 0);

  // Create market maker entry
  const marketMakerEntry = {
    player: "market-maker",
    nickname: "Market Maker",
    realizedPNL: mmRealized,
    unrealizedPNL: mmUnrealized,
    totalPNL: mmRealized + mmUnrealized,
    isMarketMaker: true,
  };

  // Combine and sort all entries
  const leaderboardData = [...playerData, marketMakerEntry].sort(
    (a, b) => b.totalPNL - a.totalPNL
  );

  return (
    <TooltipProvider>
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
              {leaderboardData.map((entry, index) => {
                const isMe =
                  me && me.toLowerCase() === entry.player.toLowerCase();

                // Special styling for market maker
                const rowClass = entry.isMarketMaker
                  ? "border-b border-gray-700 bg-blue-900/30 hover:bg-blue-800/40"
                  : `border-b border-gray-700 hover:bg-gray-700 ${
                      isMe ? "bg-orange-900/30 ring-1 ring-orange-500" : ""
                    }`;

                return (
                  <TableRow key={index} className={rowClass}>
                    <TableCell className="p-2 text-center">
                      {(index + 1).toString().padStart(3, "0")}
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex items-center">
                        {entry.isMarketMaker ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center text-blue-400 font-medium cursor-help">
                                {entry.nickname}
                                <InformationCircleIcon className="w-4 h-4 ml-1 text-blue-400" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Market Maker PNL is equal to the value lost by
                                players
                              </p>
                              <div className="mt-2 text-xs">
                                <Link
                                  href="/learn#market-maker"
                                  className="text-blue-400 hover:text-blue-300 flex items-center"
                                  onClick={(e) => e.stopPropagation()}
                                  target="_blank"
                                >
                                  <span>Learn more</span>
                                  <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                                </Link>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Link
                            href={`/player/${entry.player}`}
                            target="_blank"
                          >
                            <span
                              className={`flex items-center hover:underline ${
                                isMe
                                  ? "text-orange-400 font-medium"
                                  : "text-white"
                              }`}
                            >
                              <span>{entry.nickname}</span>
                              <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1 text-gray-400" />
                            </span>
                          </Link>
                        )}
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Leaderboard;
