// Banner.jsx

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { AnimatePresence } from "framer-motion";
import Flyout from "./Flyout";
import EmojiRain from "./EmojiRain"; // Import the new component
import { useSwitchChain } from "wagmi";

export default function Banner({ address }) {
  const [bannerState, setBannerState] = useState(0);
  const [flyoutVisible, setFlyoutVisible] = useState(false);
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    const b = Cookies.get("bannerState");
    if (b === "0") {
      setBannerState(0);
    } else if (b === "2") {
      setBannerState(2);
    } else {
      setBannerState(1);
    }
  }, []);

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (flyoutVisible) {
      timerId = setTimeout(() => {
        setFlyoutVisible(false);
      }, 10000);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [flyoutVisible]);

  const handleFirstDone = () => {
    switchChain({ chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) });
    setBannerState(2);
    Cookies.set("bannerState", "2", { expires: 365 });
  };

  const handleSecondDone = () => {
    switchChain({ chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) });
    setFlyoutVisible(true);
    setBannerState(0);
    Cookies.set("bannerState", "0", { expires: 365 });
  };

  const walletConnected = Boolean(address);

  if (bannerState === 0) {
    return (
      // AnimatePresence manages both components exiting
      <AnimatePresence>
        {flyoutVisible && (
          <>
            <Flyout />
            <EmojiRain />
          </>
        )}
      </AnimatePresence>
    );
  }

  // Render the main Banner content
  return (
    <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-center text-sm sm:text-base min-h-[44px] overflow-hidden">
      <div className="flex items-center justify-center w-full">
        {walletConnected ? (
          bannerState === 1 ? (
            <span className="text-center flex items-center flex-wrap justify-center gap-2">
              Follow the onboarding guide to set up Chart
              <button
                onClick={handleFirstDone}
                className="bg-white text-indigo-700 ml-2 px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer hover:bg-indigo-100 flex-shrink-0"
              >
                Done
              </button>
            </span>
          ) : (
            <span className="text-center flex items-center flex-wrap justify-center gap-2">
              Now let&apos;s get to trading
              <button
                onClick={handleSecondDone}
                className="bg-white text-indigo-700 ml-2 px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer hover:bg-indigo-100 flex-shrink-0"
              >
                I&apos;m ready!
              </button>
            </span>
          )
        ) : (
          <span className="text-center">
            👋 Welcome! Connect your wallet to get started
          </span>
        )}
      </div>
    </div>
  );
}
