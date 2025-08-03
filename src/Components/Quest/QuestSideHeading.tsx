"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useQuestContext } from "@/contexts/QuestContext";
import { useState } from "react";

const QuestSideHeading: React.FC = () => {
  const { discoveredQuests, questsData } = useQuestContext();
  const progressPercentage = questsData.length > 0 ? (discoveredQuests.size / questsData.length) * 100 : 0;
  const isCompleted = discoveredQuests.size === questsData.length && questsData.length > 0;
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <>
      {/* Mobile Quest Indicator */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="md:hidden fixed top-4 left-4 z-50"
      >
        <div className="bg-[#17191a] border border-[#84d46c]/30 rounded-xl px-3 py-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#84d46c] rounded-full animate-pulse"></div>
            <span className="font-vt323 text-[#84d46c] text-sm tracking-wider">
              QUEST {discoveredQuests.size}/{questsData.length}
            </span>
            {isCompleted && <span className="text-xs">🏆</span>}
          </div>
        </div>
      </motion.div>

      {/* Desktop Quest Panel */}
      <div className="hidden md:block fixed left-3 xl:left-6 top-1/2 transform -translate-y-1/2 z-40">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            // Collapsed Icon Button
            <motion.button
              key="collapsed"
              initial={{ x: -60, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -60, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onClick={() => setIsOpen(true)}
              className="group bg-[#17191a] cursor-pointer border border-[#84d46c]/30 rounded-xl p-3 shadow-xl backdrop-blur-md hover:border-[#84d46c]/60 hover:bg-[#84d46c]/5 transition-all duration-300"
            >
              <div className="flex flex-col items-center gap-2">
                {/* Quest Icon */}
                <div className="relative">
                  <div className="w-6 h-6 bg-[#84d46c] rounded-lg flex items-center justify-center">
                    <span className="text-black font-bold text-sm">Q</span>
                  </div>
                  {discoveredQuests.size > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-[#84d46c] text-black rounded-full flex items-center justify-center text-xs font-bold"
                    >
                      {discoveredQuests.size}
                    </motion.div>
                  )}
                </div>
                
                {/* Progress Indicator */}
                <div className="w-8 h-1 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#84d46c] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                
                {isCompleted && (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="text-[#84d46c] text-sm"
                  >
                    🏆
                  </motion.span>
                )}
              </div>
            </motion.button>
          ) : (
            // Expanded Panel
            <motion.div
              key="expanded"
              initial={{ x: -120, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -120, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-[180px] lg:w-[220px] xl:w-[240px]"
            >
              {/* Main Panel */}
              <div className="bg-[#17191a] border border-[#84d46c]/20 rounded-2xl p-4 lg:p-5 shadow-2xl backdrop-blur-md">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#84d46c] rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-[#84d46c]/60 rounded-full"></div>
                    <div className="w-1 h-1 bg-[#84d46c]/40 rounded-full"></div>
                  </div>
                  
                  {/* Close Button */}
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-6 h-6 cursor-pointer rounded-full bg-[#84d46c]/10 border border-[#84d46c]/30 flex items-center justify-center text-[#84d46c] hover:bg-[#84d46c]/20 hover:border-[#84d46c]/50 transition-all duration-200"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </motion.button>
                </div>


          {/* Quest Title */}
          <motion.h2 
            className="font-vt323 text-[#84d46c] text-[22px] lg:text-[26px] xl:text-[30px] leading-tight tracking-wider uppercase mb-4"
            animate={{ textShadow: ["0 0 5px #84d46c44", "0 0 10px #84d46c66", "0 0 5px #84d46c44"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Quest<br/>
            <span className="text-white/90">Mode</span>
          </motion.h2>
          
          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-vt323 text-[#84d46c] text-sm lg:text-base tracking-wider">
                {isCompleted ? 'COMPLETE!' : 'PROGRESS'}
              </span>
              <span className="font-vt323 text-white text-sm lg:text-base">
                {discoveredQuests.size}/{questsData.length}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-[#84d46c]/20">
              <motion.div
                className={`h-full rounded-full ${isCompleted 
                  ? 'bg-gradient-to-r from-[#84d46c] to-[#4ade80]' 
                  : 'bg-gradient-to-r from-[#84d46c]/60 to-[#84d46c]'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 300 }}
                className="flex items-center justify-center mt-2"
              >
                <span className="text-2xl">🏆</span>
              </motion.div>
            )}
          </div>
          
          {/* Decorative Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#84d46c]/30 to-transparent mb-4"></div>
          
          {/* Quest Hint */}
          <motion.div 
            className="font-vt323 text-white/70 text-sm lg:text-[20px] leading-relaxed"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="flex items-start gap-1 mb-1">
              <span className="text-[#84d46c]">→</span>
              <span>Hover around the page to discover</span>
            </div>
            <div className="text-white/50 text-lg ml-5">
              hidden knowledge! 🎯
            </div>
          </motion.div>
          
          {/* Achievement Badges */}
          {discoveredQuests.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 pt-4 border-t border-[#84d46c]/10"
            >
              <div className="flex items-center gap-1 mb-2">
                <span className="font-vt323 text-[#84d46c] text-[20px] tracking-wider">DISCOVERED</span>
                <div className="flex-1 h-px bg-[#84d46c]/20"></div>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                {Array.from(discoveredQuests).map((questId, index) => {
                  const quest = questsData.find(q => q.id === questId);
                  return quest ? (
                    <motion.div
                      key={questId}
                      initial={{ x: -15, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2 p-2 bg-[#84d46c]/5 rounded-lg border border-[#84d46c]/10"
                    >
                      <span className="text-sm flex-shrink-0">{quest.icon}</span>
                      <span className="font-vt323 text-[#84d46c] text-sm lg:text-lg truncate">
                        {quest.title.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </motion.div>
                  ) : null;
                })}
              </div>
            </motion.div>
          )}
          
          {/* Bottom Decoration */}
          <div className="flex justify-center mt-4 pt-3 border-t border-[#84d46c]/10">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-[#84d46c]/40 rounded-full"></div>
              <div className="w-1 h-1 bg-[#84d46c]/60 rounded-full"></div>
              <div className="w-1 h-1 bg-[#84d46c] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </motion.div>
          )}
      </AnimatePresence>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(132, 212, 108, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(132, 212, 108, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(132, 212, 108, 0.7);
        }
      `}</style>
    </>
  );
};

export default QuestSideHeading;