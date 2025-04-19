// ./components/EmojiRain.jsx
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface Particle {
  id: number;
  emoji: string;
  x: string;
  y: number;
  duration: number;
  finalY: number;
}

const EmojiRain: React.FC = () => {
  const numParticles = 60;
  const screenHeightApproximation = 1200;

  const particles: Particle[] = Array.from({ length: numParticles }).map(
    (_, i) => {
      const seed = Math.random();
      const emoji =
        seed > 0.4 ? "✨" : seed > 0.08 ? "🚀" : seed > 0.02 ? "📈" : "🤑";
      return {
        id: i,
        emoji,
        x: `${Math.random() * 100}%`,
        y: -50 - Math.random() * 150,
        duration: 5 + Math.random() * 5,
        finalY: screenHeightApproximation,
      };
    }
  );

  // --- Animation Variants ---

  // Variants for the main screen overlay
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Stagger particles AND the logo group container
      },
    },
    exit: { opacity: 0, transition: { duration: 0.5, when: "afterChildren" } },
  };

  // Variants for the container holding the three logo words
  const logoGroupVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0, // Delay the logo group slightly
        staggerChildren: 0.28, // Time between each word animating in
      },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  // Variants for EACH individual word image (zoom/fade, no rotation)
  const wordVariants = {
    hidden: {
      opacity: 0,
      scale: 0.6,
      y: 40,
    },
    visible: {
      opacity: 0.9,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 180, damping: 25, mass: 1.2 },
    },
    exit: {
      opacity: 0,
      scale: 0.7,
      y: 30,
      transition: { type: "tween", ease: "easeIn", duration: 0.3 }, // Use easeIn for exit
    },
  };

  // Particle variants (same as before)
  const particleVariants = {
    hidden: (p: Particle) => ({ opacity: 0, y: p.y, x: p.x }),
    visible: (p: Particle) => ({
      opacity: [0, 1, 1, 0],
      y: p.finalY,
      x: p.x,
      transition: {
        duration: p.duration,
        ease: "linear",
        opacity: { times: [0, 0.1, 0.9, 1], duration: p.duration },
      },
    }),
  };

  return (
    // Main container
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 w-screen h-screen pointer-events-none z-[99] overflow-hidden"
    >
      {/* Render Particles first */}
      {particles.map((particle) => (
        // ... particle span mapping ...
        <motion.span
          key={particle.id}
          variants={particleVariants}
          custom={particle}
          className="absolute text-xl md:text-2xl font-emoji"
          style={{ left: particle.x, top: 0 }}
        >
          {particle.emoji}
        </motion.span>
      ))}

      {/* --- Logo Group Container --- */}
      {/* Added aspect-[5/1] to give it height based on its width */}
      <motion.div
        variants={logoGroupVariants}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                   w-[65%]
                   aspect-[137/68]
                   z-10"
      >
        {/* Word 1: Top - Absolute position */}
        <motion.div
          variants={wordVariants}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src="/top.png"
            alt="CRYPTO"
            layout="fill"
            objectFit="contain"
            priority
            className="drop-shadow-lg pointer-events-none"
          />
        </motion.div>

        {/* Word 2: Mid - Absolute position */}
        <motion.div
          variants={wordVariants}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src="/mid.png"
            alt="TRADING"
            layout="fill"
            objectFit="contain"
            priority
            className="drop-shadow-lg pointer-events-none"
          />
        </motion.div>

        {/* Word 3: Bot - Absolute position */}
        <motion.div
          variants={wordVariants}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src="/bot.png"
            alt="COMPETITION"
            layout="fill"
            objectFit="contain"
            priority
            className="drop-shadow-lg pointer-events-none"
          />
        </motion.div>
      </motion.div>
      {/* End Logo Group Container */}
    </motion.div> // End Main container
  );
};

export default EmojiRain;
