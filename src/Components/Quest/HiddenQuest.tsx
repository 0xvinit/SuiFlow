"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuestContext } from "@/contexts/QuestContext";

interface HiddenQuestProps {
  questId: string;
  triggerArea: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width: string;
    height: string;
  };
}

const HiddenQuest: React.FC<HiddenQuestProps> = ({
  questId,
  triggerArea,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { openQuest, getQuest, discoveredQuests } = useQuestContext();
  const quest = getQuest(questId);

  if (!quest) return null;

  const isDiscovered = discoveredQuests.has(questId);

  return (
    <div
      className="fixed z-30 cursor-pointer"
      style={{
        top: triggerArea.top,
        left: triggerArea.left,
        right: triggerArea.right,
        bottom: triggerArea.bottom,
        width: triggerArea.width,
        height: triggerArea.height,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => openQuest(questId)}
    >
      {/* Always show some visual feedback when hovering, even if subtle */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Area highlight on hover */}
            <motion.div
              className="absolute inset-0 bg-[#84d46c]/10 border border-[#84d46c]/30 rounded-lg backdrop-blur-sm"
              animate={{ 
                opacity: 0.6,
                borderColor: "rgba(132, 212, 108, 0.4)"
              }}
            />

            {/* Quest indicator */}
            <motion.div
              className="
                relative flex items-center justify-center
                w-10 h-10 rounded-full
                bg-gradient-to-br from-[#84d46c]/70 to-[#4ade80]/70 
                backdrop-blur-md border border-[#84d46c]/80
                text-white text-lg
                shadow-lg shadow-[#84d46c]/50
              "
              whileHover={{ scale: 1.1 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <span>❓</span>
              
              {!isDiscovered && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-[#84d46c] rounded-full"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Hint text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 pointer-events-none"
            >
              <div className="
                bg-black/95 backdrop-blur-md 
                border border-[#84d46c]/40 
                rounded-lg px-3 py-1 
                text-[#84d46c] font-vt323 text-sm
                whitespace-nowrap
                shadow-lg
              ">
                🎯 {quest.title}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HiddenQuest;