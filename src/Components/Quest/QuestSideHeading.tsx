"use client";
import { motion } from "framer-motion";
import { useQuestContext } from "@/contexts/QuestContext";

const QuestSideHeading: React.FC = () => {
  const { discoveredQuests, questsData } = useQuestContext();
  
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      className="fixed left-2 xl:left-6 top-[50%] transform -translate-y-1/2 z-40 max-w-[120px] xl:max-w-[140px] 2xl:max-w-none"
    >
      <div className="text-left">
        {/* Quest Heading */}
        <h2 className="text-[24px] lg:text-[28px] xl:text-[32px] leading-[24px] lg:leading-[28px] xl:leading-[32px] tracking-wider uppercase font-vt323 text-[#84d46c] mb-3">
          Quest<br/>Mode
        </h2>
        
        {/* Accent Line */}
        <div className="w-10 h-1 bg-gradient-to-r from-[#84d46c] to-[#4ade80] rounded-full mb-4"></div>
        
        {/* Progress Counter */}
        <div className={`bg-black/60 backdrop-blur-md border rounded-lg px-3 py-2 mb-4 transition-all duration-300 ${
          discoveredQuests.size === questsData.length && questsData.length > 0 
            ? 'border-[#84d46c] bg-[#84d46c]/10 animate-pulse' 
            : 'border-[#84d46c]/30'
        }`}>
          <div className="text-[#84d46c] font-vt323 text-sm">
            <div className="text-base text-gray-400 mb-1">
              {discoveredQuests.size === questsData.length && questsData.length > 0 ? 'COMPLETE!' : 'Progress'}
            </div>
            <div className="text-lg font-bold">
              {discoveredQuests.size}/{questsData.length}
              {discoveredQuests.size === questsData.length && questsData.length > 0 && ' 🏆'}
            </div>
          </div>
        </div>
        
        {/* Quest Hint */}
        <motion.div 
          className="text-sm xl:text-base font-vt323 text-gray-400 max-w-[130px] xl:max-w-[150px] 2xl:max-w-[150px] leading-relaxed"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Hover around the page to discover hidden knowledge quests! 🎯
        </motion.div>
        
        {/* Achievement Badges */}
        {discoveredQuests.size > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-4 space-y-1"
          >
            {Array.from(discoveredQuests).map((questId) => {
              const quest = questsData.find(q => q.id === questId);
              return quest ? (
                <motion.div
                  key={questId}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-2 text-base"
                >
                  <span className="text-sm">{quest.icon}</span>
                  <span className="text-[#84d46c] font-vt323 truncate max-w-[100px] xl:max-w-[120px]">
                    {quest.title.split(' ')[0]}
                  </span>
                </motion.div>
              ) : null;
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default QuestSideHeading;