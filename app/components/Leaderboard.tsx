"use client";
import React from "react";
import Link from "next/link";
import { getNickname } from "../../utils/contract";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { usePathname } from "next/navigation";
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
import { useSimpleMode } from "./Header";

interface LeaderboardProps {
  participants: string[];
  realizedPNLs: number[];
  unrealizedPNLs: number[];
  mmRealized: number;
  mmUnrealized: number;
  me?: string;
  currentRoundToken?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  participants = [],
  realizedPNLs = [],
  unrealizedPNLs = [],
  mmRealized = 0,
  mmUnrealized = 0,
  me,
  currentRoundToken,
}) => {
  // Get the current path
  const pathname = usePathname();
  // Get simple mode state
  const { isSimpleMode } = useSimpleMode();

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
  let leaderboardData = [...playerData, marketMakerEntry].sort(
    (a, b) => b.totalPNL - a.totalPNL
  );

  // Filter out market maker in simple mode
  if (isSimpleMode) {
    leaderboardData = leaderboardData.filter((entry) => !entry.isMarketMaker);
  }

  // Determine the tooltip message based on the path
  const tooltipMessage =
    pathname === "/leaderboard"
      ? "This leaderboard is cumulative. It includes PNL from all rounds."
      : "This leaderboard only counts PNL from the current round.";

  const columnName = pathname === "/leaderboard" ? "All Time PNL" : "Round PNL";

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
                {!isSimpleMode && (
                  <>
                    <th className="p-2 text-right text-white font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-end cursor-help">
                            Realized PNL
                            <InformationCircleIcon className="w-4 h-4 ml-1 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>PNL from USDM balance</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="p-2 text-right text-white font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-end cursor-help">
                            Unrealized PNL
                            <InformationCircleIcon className="w-4 h-4 ml-1 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Profit if player sold all their tokens now</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  </>
                )}
                <th className="p-2 text-right text-white font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-end cursor-help">
                        {columnName}
                        <InformationCircleIcon className="w-4 h-4 ml-1 text-gray-400" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltipMessage}</p>
                    </TooltipContent>
                  </Tooltip>
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

                // Calculate rank - skip incrementing for market maker
                const displayRank = entry.isMarketMaker
                  ? ""
                  : (
                      index +
                      1 -
                      leaderboardData
                        .slice(0, index)
                        .filter((e) => e.isMarketMaker).length
                    )
                      .toString()
                      .padStart(3, "0");

                return (
                  <TableRow key={index} className={rowClass}>
                    <TableCell className="p-2 text-center">
                      {displayRank}
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
                                players.
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
                          <div className="flex items-center gap-2">
                            {isSimpleMode ? (
                              <span
                                className={isMe ? "text-orange-400 font-medium" : "text-white"}
                              >
                                {entry.nickname}
                              </span>
                            ) : (
                              <>
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
                                
                                {pathname !== "/leaderboard" && currentRoundToken && (
                                  <Link
                                    href={`https://dexscreener.com/optimism/${currentRoundToken}?maker=${entry.player}`}
                                    target="_blank"
                                    title="View on DexScreener"
                                    className="text-blue-400 hover:text-blue-300 ml-1"
                                  >
                                    <span className="flex items-center text-xs">
                                      <span>Trades</span>
                                      <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
                                    </span>
                                  </Link>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {!isSimpleMode && (
                      <>
                        <TableCell
                          className={`p-2 text-right ${
                            entry.realizedPNL < 0
                              ? "text-red-400"
                              : entry.realizedPNL > 0
                              ? "text-green-400"
                              : "text-gray-400"
                          }`}
                        >
                          {parseFloat(
                            entry.realizedPNL.toFixed(2)
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
                          {parseFloat(
                            entry.unrealizedPNL.toFixed(2)
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </>
                    )}
                    <TableCell
                      className={`p-4 text-right ${
                        entry.totalPNL < 0
                          ? "text-red-400"
                          : entry.totalPNL > 0
                          ? "text-green-400"
                          : "text-gray-400"
                      }`}
                    >
                      {parseFloat(entry.totalPNL.toFixed(2)).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
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
