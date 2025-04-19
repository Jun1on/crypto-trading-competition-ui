import React from "react";
import { motion } from "framer-motion";

const Flyout: React.FC = () => {
  // Variants ONLY for the toast container itself
  const toastVariants = {
    hidden: { opacity: 0, y: -100, scale: 0.7, rotateX: -45 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: { type: "spring", stiffness: 350, damping: 25, mass: 1 },
    },
    exit: {
      opacity: 0,
      y: 50,
      scale: 0.8,
      rotateX: 15,
      transition: { type: "tween", ease: "easeIn", duration: 0.3 },
    },
  };

  return (
    // Outer motion div for overall toast animation & positioning
    <motion.div
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // Ensure toast (z-100) is above rain (z-99)
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] perspective-[800px]"
    >
      {/* Inner div for styling - No particle container logic needed */}
      <div
        className="
          text-center text-white font-bold
          rounded-xl p-5 shadow-2xl shadow-purple-500/40
          bg-gradient-to-br from-violet-500 via-purple-600 to-pink-500
          border border-white/20 backdrop-blur-sm
          cool-gradient-anim
          transform-gpu
          hover:scale-[1.03]
          transition-transform duration-300 ease-out"
      >
        <span className="block text-lg tracking-wide text-shadow-sm drop-shadow-lg">
          good luck, have fun!
        </span>
      </div>
    </motion.div>
  );
};

export default Flyout;
