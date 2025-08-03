"use client";
import { motion } from "framer-motion";
import { useQuestContext } from "@/contexts/QuestContext";

interface FloatingQuestProps {
  questId: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center-left" | "center-right";
  className?: string;
}

const FloatingQuest: React.FC<FloatingQuestProps> = ({
  questId,
  position,
  className = "",
}) => {
  const { openQuest, getQuest, discoveredQuests } = useQuestContext();
  const quest = getQuest(questId);

  if (!quest) return null;

  const isDiscovered = discoveredQuests.has(questId);

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "fixed top-24 left-6 z-40";
      case "top-right":
        return "fixed top-24 right-6 z-40";
      case "bottom-left":
        return "fixed bottom-6 left-6 z-40";
      case "bottom-right":
        return "fixed bottom-6 right-6 z-40";
      case "center-left":
        return "fixed top-1/2 left-6 transform -translate-y-1/2 z-40";
      case "center-right":
        return "fixed top-1/2 right-6 transform -translate-y-1/2 z-40";
      default:
        return "fixed top-24 right-6 z-40";
    }
  };

  return (
    <motion.div
      className={`${getPositionClasses()} ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: Math.random() * 2 + 1, duration: 0.5 }}
    >
      <motion.button
        onClick={() => openQuest(questId)}
        className="
          relative flex items-center justify-center
          w-16 h-16 rounded-full
          bg-gradient-to-br from-[#84d46c]/30 to-[#4ade80]/30 
          backdrop-blur-md border border-[#84d46c]/40
          text-[#84d46c] 
          hover:from-[#84d46c]/50 hover:to-[#4ade80]/50
          hover:border-[#84d46c]/60
          transition-all duration-300
          shadow-lg hover:shadow-[#84d46c]/30
          group
        "
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={`Discover: ${quest.title}`}
      >
        {/* Quest Icon */}
        <span className="text-2xl">{quest.icon}</span>

        {/* Pulsing indicator for undiscovered quests */}
        {!isDiscovered && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-[#84d46c] rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Floating sparkles animation */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#84d46c] rounded-full"
              style={{
                top: `${20 + i * 20}%`,
                left: `${20 + i * 20}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </motion.div>

        {/* Hover tooltip */}
        <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-300 pointer-events-none
          z-50
        ">
          <div className="
            bg-black/90 backdrop-blur-md 
            border border-[#84d46c]/30 
            rounded-lg px-3 py-2 
            text-[#84d46c] font-vt323 text-sm
            whitespace-nowrap
            shadow-lg
          ">
            {quest.title}
            <div className="
              absolute top-full left-1/2 transform -translate-x-1/2
              border-4 border-transparent border-t-[#84d46c]/30
            " />
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
};

export default FloatingQuest;