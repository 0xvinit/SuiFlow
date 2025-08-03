"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuestContext } from "@/contexts/QuestContext";
import HiddenQuest from "./HiddenQuest";
import QuestSideHeading from "./QuestSideHeading";
import QuestConfetti from "./QuestConfetti";

interface QuestManagerProps {
  className?: string;
}

const QuestManager: React.FC<QuestManagerProps> = ({ className = "" }) => {
  const [showQuestBanner, setShowQuestBanner] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const { activeQuest, discoveredQuests, closeQuest, getQuest, questsData } = useQuestContext();
  const questRef = useRef<HTMLDivElement>(null);

  const activeQuestData = activeQuest ? getQuest(activeQuest) : null;
  const allQuestsCompleted = discoveredQuests.size === questsData.length && questsData.length > 0;

  // Trigger confetti when all quests are completed
  useEffect(() => {
    if (allQuestsCompleted && !hasTriggeredConfetti) {
      setShowConfetti(true);
      setHasTriggeredConfetti(true);
    }
  }, [allQuestsCompleted, hasTriggeredConfetti]);

  // Close quest when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (questRef.current && !questRef.current.contains(event.target as Node)) {
        closeQuest();
      }
    };

    if (activeQuest) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeQuest, closeQuest]);

  useEffect(() => {
    if (showConfetti) {
      document.body.style.overflow = "hidden"; // Hide scrollbar
    } else {
      document.body.style.overflow = "auto"; // Restore scrollbar
    }

    return () => {
      document.body.style.overflow = "auto"; // Cleanup on unmount
    };
  }, [showConfetti]);

  return (
    <div className={className}>
      {/* Quest Discovery Banner */}
       {/* <AnimatePresence>
        {showQuestBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="
              bg-gradient-to-r from-[#84d46c]/20 to-[#4ade80]/20 
              backdrop-blur-md border border-[#84d46c]/30 
              rounded-full px-6 py-3 
              text-[#84d46c] font-vt323 text-sm
              shadow-lg shadow-[#84d46c]/10
              flex items-center gap-3
            ">
              <span className="text-lg animate-pulse">🎯</span>
              <span className="text-sm font-medium">
                🎮 Find hidden quests around the page to learn about cross-chain swaps!
              </span>
              <span className="text-xs bg-[#84d46c]/20 px-2 py-1 rounded-full">
                {discoveredQuests.size}/{questsData.length}
              </span>
              <button
                onClick={() => setShowQuestBanner(false)}
                className="text-gray-400 hover:text-white transition-colors ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>  */}

      {/* Global Quest Modal */}
      <AnimatePresence>
        {activeQuest && activeQuestData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              ref={questRef}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="
                max-w-lg w-full bg-black/90 backdrop-blur-md 
                border border-[#84d46c]/30 rounded-2xl 
                overflow-hidden shadow-2xl
                max-h-[80vh] overflow-y-auto custom-scrollbar
              "
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#84d46c]/10 to-[#4ade80]/10 p-6 border-b border-[#84d46c]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{activeQuestData.icon}</span>
                    <h3 className="text-[#84d46c] font-vt323 text-[24px] font-bold">
                      {activeQuestData.title}
                    </h3>
                  </div>
                  <button
                    onClick={closeQuest}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Question */}
                <div className="mt-4 p-4 bg-[#84d46c]/5 rounded-lg border border-[#84d46c]/10">
                  <p className="text-gray-300 font-vt323 text-[20px] leading-relaxed">
                    {activeQuestData.question}
                  </p>
                </div>
              </div>

              {/* Answer Content */}
              <div className="p-6">
                <div 
                  className="text-gray-200 font-vt323 text-lg leading-relaxed space-y-2"
                  dangerouslySetInnerHTML={{ 
                    __html: activeQuestData.answer
                      .replace(/\n/g, '<br>')
                      .replace(/• /g, '<span class="text-[#84d46c]">• </span>')
                      .replace(/:\w+:/g, (match: string) => {
                        // Convert emoji codes to actual emojis
                        const emojiMap: { [key: string]: string } = {
                          ':lock:': '🔒',
                          ':bulb:': '💡',
                          ':alarm_clock:': '⏰',
                          ':white_check_mark:': '✅',
                          ':robot_face:': '🤖',
                          ':muscle:': '💪',
                          ':trophy:': '🏆',
                          ':zap:': '⚡',
                          ':bridge_at_night:': '🌉',
                          ':closed_lock_with_key:': '🔐',
                          ':link:': '🔗',
                          ':dart:': '🎯',
                          ':chart_with_downwards_trend:': '📉'
                        };
                        return emojiMap[match] || match;
                      })
                  }}
                />
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-[#84d46c]/5 to-[#4ade80]/5 p-4 border-t border-[#84d46c]/10">
                <p className="text-sm text-gray-500 font-vt323 text-center">
                  Continue exploring to unlock more quests! 🎯
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Quest Heading */}
      <QuestSideHeading />

      {/* Hidden Quest Areas for True Gamified Discovery - Hover Only */}
      <HiddenQuest 
        questId="htlc" 
        triggerArea={{ bottom: "140px", right: "200px", width: "120px", height: "100px" }}
      />
      
      <HiddenQuest 
        questId="dutch-auction" 
        triggerArea={{ top: "250px", right: "50px", width: "140px", height: "80px" }}
      />

      <HiddenQuest 
        questId="resolvers" 
        triggerArea={{ bottom: "200px", left: "300px", width: "100px", height: "120px" }}
      />

      <HiddenQuest 
        questId="partial-fills" 
        triggerArea={{ top: "200px", left: "150px", width: "80px", height: "80px" }}
      />

      <HiddenQuest 
        questId="cross-chain" 
        triggerArea={{ bottom: "100px", left: "500px", width: "100px", height: "60px" }}
      />

      {/* Confetti Celebration */}
      <QuestConfetti 
        isActive={showConfetti} 
        onClose={() => setShowConfetti(false)} 
      />
    </div>
  );
};

export default QuestManager;