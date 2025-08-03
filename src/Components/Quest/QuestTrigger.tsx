"use client";
import { motion } from "framer-motion";
import { useQuestContext } from "@/contexts/QuestContext";

interface QuestTriggerProps {
  questId: string;
  children: React.ReactNode;
  className?: string;
  hoverOnly?: boolean;
}

const QuestTrigger: React.FC<QuestTriggerProps> = ({
  questId,
  children,
  className = "",
  hoverOnly = false
}) => {
  const { openQuest, getQuest, discoveredQuests } = useQuestContext();
  const quest = getQuest(questId);

  if (!quest) return <>{children}</>;

  const isDiscovered = discoveredQuests.has(questId);

  return (
    <div className={`relative group ${className}`}>
      {children}
      
      {/* Quest Indicator */}
      <motion.button
        onClick={() => openQuest(questId)}
        className={`
          absolute -top-2 -right-2 z-20
          w-6 h-6 rounded-full 
          bg-gradient-to-r from-[#84d46c] to-[#4ade80]
          text-black text-xs font-bold
          flex items-center justify-center
          shadow-lg shadow-[#84d46c]/30
          transition-all duration-300
          ${hoverOnly ? 'opacity-0 group-hover:opacity-100' : ''}
          ${isDiscovered ? 'animate-pulse' : 'animate-bounce'}
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={`Learn about: ${quest.title}`}
      >
        ?
      </motion.button>

      {/* Hover Tooltip */}
      <div className="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        opacity-0 group-hover:opacity-100 
        transition-opacity duration-300 pointer-events-none
        z-30
      ">
        <div className="
          bg-black/90 backdrop-blur-md 
          border border-[#84d46c]/30 
          rounded-lg px-3 py-2 
          text-[#84d46c] font-vt323 text-xs
          whitespace-nowrap
          shadow-lg
        ">
          <span className="mr-1">{quest.icon}</span>
          {quest.title}
          <div className="
            absolute top-full left-1/2 transform -translate-x-1/2
            border-4 border-transparent border-t-[#84d46c]/30
          " />
        </div>
      </div>
    </div>
  );
};

export default QuestTrigger;