"use client";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface QuestConfettiProps {
  isActive: boolean;
  onClose: () => void;
}

const QuestConfetti: React.FC<QuestConfettiProps> = ({ isActive, onClose }) => {
  const [windowDimensions, setWindowDimensions] = useState({ 
    width: 0, 
    height: 0 
  });
  const [confettiComplete, setConfettiComplete] = useState(false);

  // Get window dimensions
  useEffect(() => {
    const updateWindowDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateWindowDimensions();
    window.addEventListener("resize", updateWindowDimensions);

    return () => window.removeEventListener("resize", updateWindowDimensions);
  }, []);

  // Reset confetti state when activated
  useEffect(() => {
    if (isActive) {
      setConfettiComplete(false);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      

      {/* Celebration Modal */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            // Close when clicking on backdrop
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                duration: 0.6 
              }}
              className="
                bg-gradient-to-br from-black/90 to-black/80 
                backdrop-blur-md border-2 border-[#84d46c]/50 
                rounded-3xl p-8 text-center 
                shadow-2xl shadow-[#84d46c]/30
                max-w-md mx-4 relative
              "
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on modal
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="
                  absolute top-4 right-4 
                  w-8 h-8 rounded-full 
                  bg-gray-700/50 hover:bg-gray-600/70
                  flex items-center justify-center
                  text-gray-300 hover:text-white
                  transition-all duration-200
                  z-10
                "
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className="text-8xl mb-4"
              >
                🏆
              </motion.div>

              {/* Celebration Text */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-vt323 text-[#84d46c] mb-3 tracking-wider"
              >
                QUEST MASTER!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-white font-vt323 text-lg mb-4 leading-relaxed"
              >
                🎉 Congratulations! 🎉<br/>
                You've discovered all the secrets of<br/>
                <span className="text-[#84d46c] font-bold">Cross-Chain Swaps!</span>
              </motion.p>

              {/* Achievement Badges */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: "spring" }}
                className="flex justify-center gap-2 mb-6"
              >
                {['🔐', '📉', '🤖', '⚡', '🌉'].map((icon, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 1 + (index * 0.1),
                      type: "spring",
                      stiffness: 300 
                    }}
                    className="
                      w-12 h-12 rounded-full 
                      bg-[#84d46c]/20 border border-[#84d46c]/40
                      flex items-center justify-center text-xl
                    "
                  >
                    {icon}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-sm text-gray-400 font-vt323 mb-4"
              >
                You now understand HTLC, Dutch Auctions,<br/>
                Resolvers, Partial Fills & Cross-Chain Coordination!
              </motion.div>

              {/* Continue Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2 }}
                onClick={onClose}
                className="
                  bg-gradient-to-r from-[#84d46c] to-[#4ade80]
                  hover:from-[#4ade80] hover:to-[#84d46c]
                  text-black font-vt323 font-bold
                  px-6 py-2 rounded-lg
                  transition-all duration-300
                  shadow-lg hover:shadow-[#84d46c]/30
                "
              >
                Continue Exploring! 🚀
              </motion.button>

              {/* Sparkle Effects */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-[#84d46c] rounded-full"
                    style={{
                      left: `${10 + (i * 7)}%`,
                      top: `${15 + (i % 3) * 25}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
      </AnimatePresence>
      {/* Confetti */}
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        recycle={false}
        numberOfPieces={300}
        gravity={0.3}
        colors={['#84d46c', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#ffffff']}
        onConfettiComplete={() => setConfettiComplete(true)}
        className="confetti-custom"
      />
    </>
  );
};

export default QuestConfetti;