// "use client";
// import React, { createContext, useContext, ReactNode } from 'react';
// import { useQuests } from '@/hooks/useQuests';

// interface QuestContextType {
//   activeQuest: string | null;
//   discoveredQuests: Set<string>;
//   openQuest: (questId: string) => void;
//   closeQuest: () => void;
//   getQuest: (questId: string) => object | null;
//   questsData: object[];
// }

// const QuestContext = createContext<QuestContextType | undefined>(undefined);

// interface QuestProviderProps {
//   children: ReactNode;
// }

// export const QuestProvider: React.FC<QuestProviderProps> = ({ children }) => {
//   const questHookData = useQuests();

//   // Adapt questHookData to match QuestContextType
//   const {
//     activeQuest,
//     discoveredQuests,
//     openQuest,
//     closeQuest,
//     getQuest,
//     questsData,
//   } = questHookData;

//   // Wrap getQuest to return null instead of undefined
//   const wrappedGetQuest = (questId: string) => {
//     const quest = getQuest(questId);
//     return quest === undefined ? null : quest;
//   };

//   return (
//     <QuestContext.Provider
//       value={{
//         activeQuest,
//         discoveredQuests,
//         openQuest,
//         closeQuest,
//         getQuest: wrappedGetQuest,
//         questsData,
//       }}
//     >
//       {children}
//     </QuestContext.Provider>
//   );

// export const useQuestContext = () => {
//   const context = useContext(QuestContext);
//   if (context === undefined) {
//     throw new Error('useQuestContext must be used within a QuestProvider');
//   }
//   return context;
// }

"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { useQuests } from '@/hooks/useQuests';

// interface QuestContextType {
//   activeQuest: string | null;
//   discoveredQuests: Set<string>;
//   closeQuest: () => void;
//   getQuest: (questId: string) => object | null;
//   questsData: object[];
// }

interface QuestProviderProps {
  children: ReactNode;
}
interface QuestContextType {
  activeQuest: string | null;
  discoveredQuests: Set<string>;
  openQuest: (questId: string) => void;
  closeQuest: () => void;
  getQuest: (questId: string) => any;
  questsData: any[];
}
const QuestContext = createContext<QuestContextType | undefined>(undefined);


export const QuestProvider: React.FC<QuestProviderProps> = ({ children }) => {
  const questHookData = useQuests();

  // Adapt questHookData to match QuestContextType
  const {
    activeQuest,
    discoveredQuests,
    openQuest,
    closeQuest,
    getQuest,
    questsData,
  } = questHookData;

  // Wrap getQuest to return null instead of undefined
  const wrappedGetQuest = (questId: string) => {
    const quest = getQuest(questId);
    return quest === undefined ? null : quest;
  };

  return (
    <QuestContext.Provider
      value={{
        activeQuest,
        discoveredQuests,
        openQuest,
        closeQuest,
        getQuest: wrappedGetQuest,
        questsData,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
};

export const useQuestContext = () => {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuestContext must be used within a QuestProvider');
  }
  return context;
};
