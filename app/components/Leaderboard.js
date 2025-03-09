'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getParticipants, getPNL } from '../../utils/contract'; // Adjust path as needed
import { ethers } from 'ethers';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const participants = await getParticipants();
                const leaderboardData = await Promise.all(
                    participants.map(async (player) => {
                        const { realizedPNL, unrealizedPNL } = await getPNL(player);
                        const totalPNL = realizedPNL + unrealizedPNL;
                        return {
                            player,
                            realizedPNL: parseFloat(ethers.formatEther(realizedPNL)),
                            unrealizedPNL: parseFloat(ethers.formatEther(unrealizedPNL)),
                            totalPNL: parseFloat(ethers.formatEther(totalPNL)),
                        };
                    })
                );
                // Sort by total PNL in descending order
                leaderboardData.sort((a, b) => b.totalPNL - a.totalPNL);
                setLeaderboard(leaderboardData);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-center text-white">Leaderboard</h1>
            <div className="overflow-auto max-h-[600px] shadow-md rounded-lg">
                <Table className="min-w-full bg-gray-800 text-white">
                    <TableHeader className="sticky top-0 bg-gray-700">
                        <TableRow>
                            <TableHead className="w-12 p-4 text-center">Rank</TableHead>
                            <TableHead className="p-4 text-left">Player</TableHead>
                            <TableHead className="p-4 text-right">Realized PNL</TableHead>
                            <TableHead className="p-4 text-right">Unrealized PNL</TableHead>
                            <TableHead className="p-4 text-right">Total PNL</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((entry, index) => (
                            <TableRow
                                key={index}
                                className={`border-b border-gray-700 hover:bg-gray-700 ${index === 0
                                    ? 'bg-yellow-900'
                                    : index === 1
                                        ? 'bg-gray-600'
                                        : index === 2
                                            ? 'bg-amber-700'
                                            : ''
                                    }`}
                            >
                                <TableCell className="p-4 text-center">{index + 1}</TableCell>
                                <TableCell className="p-4">
                                    <div className="flex items-center">
                                        <Link href={`/player/${entry.player}`} legacyBehavior>
                                            <a
                                                className="text-blue-400 hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {entry.player.slice(0, 6) + '...' + entry.player.slice(-4)}
                                            </a>
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell
                                    className={`p-4 text-right ${entry.realizedPNL < 0 ? 'text-red-400' : 'text-green-400'
                                        }`}
                                >
                                    {entry.realizedPNL.toFixed(2)}
                                </TableCell>
                                <TableCell
                                    className={`p-4 text-right ${entry.unrealizedPNL < 0 ? 'text-red-400' : 'text-green-400'
                                        }`}
                                >
                                    {entry.unrealizedPNL.toFixed(2)}
                                </TableCell>
                                <TableCell
                                    className={`p-4 text-right ${entry.totalPNL < 0 ? 'text-red-400' : 'text-green-400'
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