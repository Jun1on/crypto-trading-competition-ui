"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";

// Add type declaration for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (
        event: string,
        callback: (...args: any[]) => void
      ) => void;
    };
  }
}

const Header = () => {
  const pathname = usePathname();
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Participation", href: "/participation" },
  ];

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await open();
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="bg-gray-900 text-white py-4">
      <nav className="flex justify-center space-x-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <span
                className={`px-3 py-2 text-lg font-medium border-b-2 ${
                  isActive
                    ? "text-orange-500 border-orange-500"
                    : "text-gray-300 hover:text-white hover:border-gray-600 border-transparent"
                } transition-all duration-200`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute top-4 right-4">
        {isConnected && address ? (
          <div className="flex items-center space-x-2">
            <div
              className="px-4 py-2 bg-gray-800 rounded-md text-orange-500 font-medium cursor-pointer"
              onClick={handleConnect}
            >
              {formatAddress(address)}
            </div>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-md font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
