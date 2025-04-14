"use client";

import { useState, useEffect } from "react";
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
  // Add state to track if component is mounted (client-side only)
  const [mounted, setMounted] = useState(false);

  // Set mounted state to true when component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Participation", href: "/participation" },
    { name: "Learn", href: "/learn" },
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

  // Render a consistent button during SSR to prevent hydration mismatch
  const renderWalletButton = () => {
    // Use a placeholder during server rendering
    if (!mounted) {
      return (
        <button className="px-4 py-2 bg-orange-500 rounded-md font-medium">
          Connect Wallet
        </button>
      );
    }

    // Show actual state-dependent UI on client
    return isConnected && address ? (
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
    );
  };

  return (
    <header className="bg-gray-900 text-white py-4 relative">
      {pathname !== "/swap" ? (
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
      ) : (
        <div className="flex justify-center space-x-8">
          <Link href="/swap">
            <span className="px-3 py-2 text-lg font-medium border-b-2 text-orange-500 border-orange-500">
              Swap
            </span>
          </Link>
        </div>
      )}

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
        {renderWalletButton()}
      </div>
    </header>
  );
};

export default Header;
