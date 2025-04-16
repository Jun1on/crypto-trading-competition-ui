"use client";

import React, { useState, useRef } from "react";
import { ethers } from "ethers";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ExtendedChartDropdown = ({ roundDetails, isPreStart, isSimpleMode }) => {
  // Always initialize hooks at the top level, regardless of conditions
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const hideDropdownTimeout = useRef(null);

  // When in pre-start, show the Chart link with a tooltip.
  if (isPreStart) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={`https://dexscreener.com/optimism/${roundDetails.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors px-3 py-2 text-base font-medium"
              title="View on DexScreener"
            >
              <ChartBarIcon className="w-5 h-5 mr-2" />
              <span>Chart</span>
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Chart loading... please refresh if not loading
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // When in simple mode, show a simple Chart link.
  if (isSimpleMode) {
    return (
      <a
        href={`https://dexscreener.com/optimism/${roundDetails.tokenAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-blue-400 hover:text-blue-300 transition-colors px-3 py-2 text-base font-medium"
        title="View on DexScreener"
      >
        <ChartBarIcon className="w-5 h-5 mr-2" />
        <span>Chart</span>
      </a>
    );
  }

  // Otherwise, use the extended dropdown behavior with a delayed unhover.

  const handleMouseEnter = () => {
    if (hideDropdownTimeout.current) {
      clearTimeout(hideDropdownTimeout.current);
      hideDropdownTimeout.current = null;
    }
    setDropdownVisible(true);
  };

  const handleMouseLeave = () => {
    hideDropdownTimeout.current = setTimeout(() => {
      setDropdownVisible(false);
    }, 300);
  };

  return (
    <div
      className="relative inline-block ml-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={`https://dexscreener.com/optimism/${roundDetails.tokenAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-blue-400 hover:text-blue-300 transition-colors px-3 py-2 text-base font-medium"
        title="View on DexScreener"
      >
        <ChartBarIcon className="w-5 h-5 mr-2" />
        <span>Chart</span>
      </a>
      {dropdownVisible && (
        <div className="absolute left-0 mt-1 w-max bg-gray-800 rounded shadow-lg z-10">
          <a
            href={`https://dexscreener.com/optimism/${roundDetails.tokenAddress}?maker=${process.env.NEXT_PUBLIC_BOT_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Market Maker
          </a>
          <a
            href={`https://dexscreener.com/optimism/${roundDetails.tokenAddress}?maker=${process.env.NEXT_PUBLIC_DEV_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Dev
          </a>
        </div>
      )}
    </div>
  );
};

export default ExtendedChartDropdown;
