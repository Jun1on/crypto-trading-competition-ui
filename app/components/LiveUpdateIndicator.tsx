import React from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface LiveUpdateIndicatorProps {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  className?: string;
}

const LiveUpdateIndicator: React.FC<LiveUpdateIndicatorProps> = ({
  isRefreshing,
  lastUpdated,
  className = "",
}) => {
  return (
    <div
      className={`flex justify-between items-center text-xs text-gray-500 ${className}`}
    >
      <div className="flex items-center">
        <div
          className={`w-2 h-2 rounded-full mr-2 transition-colors duration-700 ease-in-out ${
            isRefreshing ? "bg-blue-500 animate-pulse" : "bg-green-500"
          }`}
        ></div>
        <span>Updating live</span>
      </div>

      {lastUpdated && (
        <div className="flex items-center">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <ArrowPathIcon
            className={`ml-2 w-3 h-3 ${
              isRefreshing ? "animate-spin text-blue-500" : "text-gray-500"
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default LiveUpdateIndicator;
