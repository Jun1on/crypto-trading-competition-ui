"use client";

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import Cookies from "js-cookie";
import { truncateAddress } from "../../utils/helpers";
import Banner from "./Banner";

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

// --- Simple Mode Context ---
interface SimpleModeContextType {
  isSimpleMode: boolean;
  toggleSimpleMode: () => void;
}

// Create context with a default value (can be undefined if provider is guaranteed)
const SimpleModeContext = createContext<SimpleModeContextType | undefined>(
  undefined
);

// Custom hook for easy access
export const useSimpleMode = () => {
  const context = useContext(SimpleModeContext);
  if (context === undefined) {
    throw new Error("useSimpleMode must be used within a SimpleModeProvider");
  }
  return context;
};

// Provider component
export const SimpleModeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state with default true, cookie check happens in useEffect
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  // Effect to read initial state from cookie on client-side mount
  useEffect(() => {
    const cookieValue = Cookies.get("simpleMode");
    if (cookieValue !== undefined) {
      setIsSimpleMode(cookieValue === "true");
    } else {
      // default
      setIsSimpleMode(false);
    }
  }, []); // Empty dependency array means this runs only once on mount

  useEffect(() => {
    Cookies.set("simpleMode", String(isSimpleMode), { expires: 365 });
  }, [isSimpleMode]);

  const toggleSimpleMode = () => {
    setIsSimpleMode((prev) => !prev);
  };

  return (
    <SimpleModeContext.Provider value={{ isSimpleMode, toggleSimpleMode }}>
      {children}
    </SimpleModeContext.Provider>
  );
};
// --- End Simple Mode Context ---

const Header = () => {
  const pathname = usePathname();
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { isSimpleMode, toggleSimpleMode } = useSimpleMode();

  useEffect(() => {
    setMounted(true);
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  const coreNavItems = [
    { name: "Dashboard", href: "/" },
    { name: "Swap", href: "/swap" },
    { name: "Leaderboard", href: "/leaderboard" },
  ];

  const moreNavItems = [
    { name: "Participation", href: "/participation" },
    { name: "Past Rounds", href: "/round/0" },
    { name: "Learn", href: "/learn" },
  ];

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

  const renderWalletButton = () => {
    if (!mounted) {
      return (
        <button className="px-4 py-2 bg-orange-500 rounded-md font-medium">
          Connect Wallet
        </button>
      );
    }

    return isConnected && address ? (
      <div className="flex items-center space-x-2">
        <div
          className="px-4 py-2 bg-gray-800 rounded-md text-orange-500 font-medium cursor-pointer"
          onClick={handleConnect}
        >
          {truncateAddress(address)}
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

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsMoreMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsMoreMenuOpen(false);
    }, 200);
  };

  return (
    <>
      <Banner address={address} />
      <header className="bg-gray-900 text-white py-4 relative">
        <div className="flex justify-center">
          <nav className="flex justify-center items-center space-x-8">
            {coreNavItems.map((item) => {
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

            {isSimpleMode ? (
              <Link href="/learn">
                <span
                  className={`px-3 py-2 text-lg font-medium border-b-2 ${
                    pathname === "/learn"
                      ? "text-orange-500 border-orange-500"
                      : "text-gray-300 hover:text-white hover:border-gray-600 border-transparent"
                  } transition-all duration-200`}
                >
                  Learn
                </span>
              </Link>
            ) : (
              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <span
                  className={`flex items-center text-lg font-medium cursor-pointer ${
                    pathname === "/participation" ||
                    pathname === "/learn" ||
                    pathname.startsWith("/round/")
                      ? "text-orange-500"
                      : "text-gray-300 hover:text-white"
                  } transition-all duration-200`}
                >
                  <ChevronDownIcon
                    className={`w-5 h-5 ml-1 transition-transform duration-200`}
                  />
                </span>

                {isMoreMenuOpen && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10 border border-gray-700"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="py-1">
                      {moreNavItems.map((item) => {
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                          >
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="simple-mode-toggle"
              className="text-sm font-medium text-gray-300 cursor-pointer"
            >
              Simple
            </label>
            <input
              type="checkbox"
              id="simple-mode-toggle"
              checked={isSimpleMode}
              onChange={toggleSimpleMode}
              className="sr-only"
            />
            <button
              onClick={toggleSimpleMode}
              aria-checked={isSimpleMode}
              role="switch"
              className={`
                relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out
                ${isSimpleMode ? "bg-orange-500" : "bg-gray-600"}
              `}
            >
              <span className="sr-only">Toggle simple mode</span>
              <span
                className={`
                  pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                  transition duration-200 ease-in-out
                  ${isSimpleMode ? "translate-x-4" : "translate-x-0"}
                `}
              />
            </button>
          </div>
          {renderWalletButton()}
        </div>
      </header>
    </>
  );
};

export default Header;
