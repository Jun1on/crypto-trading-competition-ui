'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getCurrentRound, getCurrentToken, getTokenInfo } from '../../utils/contract';
import { DocumentDuplicateIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import "react-loading-skeleton/dist/skeleton.css";

const RoundDashboard = () => {
    const [currentRound, setCurrentRound] = useState(null);
    const [tokenAddress, setTokenAddress] = useState(null);
    const [tokenName, setTokenName] = useState(null);
    const [tokenSymbol, setTokenSymbol] = useState(null);
    const [loading, setLoading] = useState(true);

    // Custom skeleton theme to match dark background
    const skeletonBaseColor = "#2d3748"; // dark gray
    const skeletonHighlightColor = "#4a5568"; // slightly lighter gray

    const fetchRoundInfo = async (firstRun) => {
        console.log("fetchRoundInfo")
        try {
            let newRound, newToken;
            if (firstRun === true) {
                newToken = await getCurrentToken();
                if (newToken === tokenAddress) return;
                newRound = await getCurrentRound();
            } else {
                [newRound, newToken] = await Promise.all([
                    getCurrentRound(),
                    getCurrentToken(),
                ]);
            }

            setCurrentRound(newRound);
            setTokenAddress(newToken);

            if (newToken !== ethers.ZeroAddress) {
                const [name, symbol] = await getTokenInfo(newToken);
                setTokenName(name);
                setTokenSymbol(symbol);
            } else {
                setTokenName('waiting for round to start');
                setTokenSymbol('');
            }
        } catch (error) {
            console.error('Error fetching round info:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoundInfo(true);
        const interval = setInterval(fetchRoundInfo, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = () => {
        if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
            navigator.clipboard.writeText(tokenAddress);
            toast.success('Address copied to clipboard!', { duration: 2000 });
        }
    };

    const truncatedAddress = (tokenAddress)
        ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`
        : null;

    return (
        <div className="bg-gradient-to-r from-gray-900 to-black mx-auto rounded-lg shadow-lg p-10 my-5 max-w-4xl">
            <div className="flex flex-col items-center text-white gap-4">
                <div className="text-3xl font-bold">
                    {loading ? (
                        <Skeleton width={150} height={34} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                    ) : (
                        `Round #${currentRound}`
                    )}
                </div>
                <div className="text-2xl text-orange-500 text-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Skeleton width={150} height={24} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                            <Skeleton width={200} height={68} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div>{tokenName}</div>
                            {tokenSymbol ? (<div className="text-7xl font-bold">${tokenSymbol.toUpperCase()}</div>) :
                                (<Skeleton width={200} height={68} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />)}

                        </div>
                    )}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                    {loading ? (
                        <Skeleton width={128} height={20} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                    ) : (
                        <>
                            <span className="font-mono">{truncatedAddress}</span>
                            <button
                                onClick={handleCopy}
                                className="ml-2 p-1 hover:text-gray-300 transition-colors cursor-pointer"
                                title="Copy address"
                            >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            {tokenAddress && tokenAddress !== ethers.ZeroAddress && (
                                <a
                                    href={`https://dexscreener.com/optimism/${tokenAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-3 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                                    title="View on DexScreener"
                                >
                                    <ChartBarIcon className="w-4 h-4 mr-1" />
                                    <span>Chart</span>
                                </a>
                            )}
                        </>
                    )}
                </div>
            </div>
            <Toaster />
        </div>
    );
};

export default RoundDashboard;