'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getParticipants, getPNL, getNickname } from '../../utils/contract'; // Adjust path as needed
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'; // Import the arrow icon

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const participants = await getParticipants();
            const leaderboardData = await Promise.all(
                participants.map(async (player, index) => {
                    const { realizedPNL, unrealizedPNL } = await getPNL(player);
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
            );
            leaderboardData.sort((a, b) => b.totalPNL - a.totalPNL);
            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    }, []);
    useEffect(() => {
        fetchLeaderboard();
        const intervalId = setInterval(fetchLeaderboard, 5000);
        return () => clearInterval(intervalId);
    }, [fetchLeaderboard]);

    return (
        <div className="container mx-auto max-w-4xl">
            <div className="overflow-auto max-h-[600px] shadow-md rounded-lg">
                <Table className="min-w-full bg-gray-800 text-white">
                    <TableHeader className="sticky top-0 bg-gray-700">
                        <TableRow>
                            <TableHead className="w-12 p-2 text-center text-white">Rank</TableHead>
                            <TableHead className="p-2 text-left text-white">Player</TableHead>
                            <TableHead className="p-2 text-right text-white">Realized PNL</TableHead>
                            <TableHead className="p-2 text-right text-white">Unrealized PNL</TableHead>
                            <TableHead className="p-2 text-right text-white">Total PNL</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((entry, index) => (
                            <TableRow
                                key={index}
                                className={`border-b border-gray-700 hover:bg-gray-700`}
                            >
                                <TableCell className="p-2 text-center">{(index + 1).toString().padStart(3, '0')}</TableCell>
                                <TableCell className="p-2">
                                    <div className="flex items-center">
                                        <Link href={`/player/${entry.player}`} legacyBehavior>
                                            <a
                                                className="flex items-center text-white hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <span>{entry.nickname}</span>
                                                <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1 text-gray-400" />
                                            </a>
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell
                                    className={`p-2 text-right ${entry.realizedPNL < 0 ? 'text-red-400' : entry.realizedPNL > 0 ? 'text-green-400' : 'text-gray-400'}`}
                                >
                                    {entry.realizedPNL.toFixed(2)}
                                </TableCell>
                                <TableCell
                                    className={`p-4 text-right ${entry.unrealizedPNL < 0 ? 'text-red-400' : entry.unrealizedPNL > 0 ? 'text-green-400' : 'text-gray-400'}`}
                                >
                                    {entry.unrealizedPNL.toFixed(2)}
                                </TableCell>
                                <TableCell
                                    className={`p-4 text-right ${entry.totalPNL < 0 ? 'text-red-400' : entry.totalPNL > 0 ? 'text-green-400' : 'text-gray-400'}`}
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