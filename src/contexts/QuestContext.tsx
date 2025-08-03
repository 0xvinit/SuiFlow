"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { useQuests } from '@/hooks/useQuests';

interface QuestContextType {
  activeQuest: string | null;
  discoveredQuests: Set<string>;
  openQuest: (questId: string) => void;
  closeQuest: () => void;
  getQuest: (questId: string) => any;
  questsData: any[];
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

interface QuestProviderProps {
  children: ReactNode;
}

export const QuestProvider: React.FC<QuestProviderProps> = ({ children }) => {
  const questHookData = useQuests();

  return (
    <QuestContext.Provider value={questHookData}>
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