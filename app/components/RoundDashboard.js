'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLatestRoundDetails } from '../../utils/contract';
import { DocumentDuplicateIcon, ChartBarIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import "react-loading-skeleton/dist/skeleton.css";

const RoundDashboard = () => {
    const [roundDetails, setRoundDetails] = useState({
        currentRound: 0,
        tokenAddress: null,
        tokenName: '',
        tokenSymbol: '',
        startTime: 0,
        endTime: 0,
        airdropAmount: 0,
        USDM: ''
    });
    const [loading, setLoading] = useState(true);

    // Custom skeleton theme to match dark background
    const skeletonBaseColor = "#2d3748"; // dark gray
    const skeletonHighlightColor = "#4a5568"; // slightly lighter gray

    const fetchRoundInfo = async () => {
        try {
            const details = await getLatestRoundDetails();

            setRoundDetails({
                currentRound: details.latestRound,
                tokenAddress: details.token,
                tokenName: details.name,
                tokenSymbol: details.symbol,
                startTime: details.startTimestamp,
                endTime: details.endTimestamp,
                airdropAmount: details.airdropPerParticipantUSDM,
                USDM: details.USDM
            });
        } catch (error) {
            console.error('Error fetching round info:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoundInfo();
        const interval = setInterval(fetchRoundInfo, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCopy = () => {
        const { tokenAddress } = roundDetails;
        if (tokenAddress && tokenAddress !== ethers.ZeroAddress) {
            navigator.clipboard.writeText(tokenAddress);
            toast.success('Address copied to clipboard!', { duration: 2000 });
        }
    };

    const truncatedAddress = (roundDetails.tokenAddress && roundDetails.tokenAddress !== ethers.ZeroAddress)
        ? `${roundDetails.tokenAddress.slice(0, 6)}...${roundDetails.tokenAddress.slice(-4)}`
        : null;

    return (
        <div className="bg-gradient-to-r from-gray-900 to-black mx-auto rounded-lg shadow-lg p-10 mb-5 max-w-4xl">
            <div className="flex flex-col items-center text-white gap-4">
                <div className="text-3xl font-bold">
                    {loading ? (
                        <Skeleton width={150} height={34} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                    ) : (
                        `Round #${roundDetails.currentRound}`
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
                            <div>{roundDetails.tokenName || 'waiting for round to start'}</div>
                            {roundDetails.tokenSymbol ? (
                                <div className="text-7xl font-bold">${roundDetails.tokenSymbol.toUpperCase()}</div>
                            ) : (
                                <Skeleton width={200} height={68} baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                            )}
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
                            {roundDetails.tokenAddress && roundDetails.tokenAddress !== ethers.ZeroAddress && (
                                <a
                                    href={`https://dexscreener.com/optimism/${roundDetails.tokenAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-3 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                                    title="View on DexScreener"
                                >
                                    <ChartBarIcon className="w-4 h-4 mr-1" />
                                    <span>Chart</span>
                                </a>
                            )}
                            {roundDetails.tokenAddress && roundDetails.USDM && roundDetails.tokenAddress !== ethers.ZeroAddress && (
                                <a
                                    href={`https://app.uniswap.org/swap?inputCurrency=${roundDetails.USDM}&outputCurrency=${roundDetails.tokenAddress}&chain=optimism`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-3 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                                    title="Trade on Uniswap"
                                >
                                    <ArrowsRightLeftIcon className="w-4 h-4 mr-1" />
                                    <span>Trade</span>
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