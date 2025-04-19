// ./components/EmojiRain.jsx

import React from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  emoji: string;
  x: string;
  y: number;
  duration: number; // This will be increased
  finalY: number;
}

const EmojiRain: React.FC = () => {
  const numParticles = 60; // Maybe slightly more particles for a longer effect
  const screenHeightApproximation = 1200;

  const particles: Particle[] = Array.from({ length: numParticles }).map(
    (_, i) => ({
      id: i,
      emoji: Math.random() > 0.4 ? "✨" : "🚀",
      x: `${Math.random() * 100}%`,
      y: -50 - Math.random() * 150, // Start further above screen, more spread out vertically
      // *** INCREASED DURATION ***
      // Make particles fall for 5 to 7.5 seconds to fill the longer visible time
      duration: 5 + Math.random() * 2.5,
      finalY: screenHeightApproximation,
    })
  );

  // --- Animation Variants ---

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        // Keep stagger relatively quick, or adjust slightly if needed
        staggerChildren: 0.07,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.5, // Keep exit fast
      },
    },
  };

  const particleVariants = {
    hidden: (p: Particle) => ({
      opacity: 0,
      y: p.y,
      x: p.x,
    }),
    visible: (p: Particle) => ({
      opacity: [0, 1, 1, 0],
      y: p.finalY,
      x: p.x,
      transition: {
        // *** USE UPDATED DURATION ***
        duration: p.duration,
        ease: "linear",
        opacity: {
          times: [0, 0.1, 0.9, 1], // Fade in 10%, stay 80%, fade out 10%
          // *** USE UPDATED DURATION ***
          duration: p.duration,
        },
      },
    }),
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 w-screen h-screen pointer-events-none z-[99] overflow-hidden"
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          variants={particleVariants}
          custom={particle}
          className="absolute text-xl md:text-2xl"
          style={{
            left: particle.x,
            top: 0,
          }}
        >
          {particle.emoji}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default EmojiRain;
