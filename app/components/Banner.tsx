// Banner.jsx

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { AnimatePresence } from "framer-motion";
import Flyout from "./Flyout";
import EmojiRain from "./EmojiRain"; // Import the new component

export default function Banner({ address }) {
  const [isVisible, setIsVisible] = useState(false);
  const [flyoutVisible, setFlyoutVisible] = useState(false);

  useEffect(() => {
    const dismissed = Cookies.get("bannerDismissed");
    if (!dismissed) {
      setIsVisible(true);
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

  const handleDone = () => {
    setIsVisible(false);
    setFlyoutVisible(true); // Show both the flyout and the rain
    Cookies.set("bannerDismissed", "true", { expires: 365 });
  };

  const walletConnected = Boolean(address);

  if (!isVisible) {
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
          <span className="text-center flex items-center flex-wrap justify-center gap-2">
            Follow the onboarding guide to set up DEXScreener
            <button
              onClick={handleDone}
              className="bg-white text-indigo-700 px-3 py-1 rounded text-sm font-medium transition-colors cursor-pointer hover:bg-indigo-100 flex-shrink-0"
            >
              I'm ready!
            </button>
          </span>
        ) : (
          <span className="text-center">
            👋 Welcome! Connect your wallet to get started
          </span>
        )}
      </div>
    </div>
  );
}
