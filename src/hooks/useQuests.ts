"use client";
import { useState, useCallback } from "react";

export interface QuestData {
  id: string;
  title: string;
  question: string;
  answer: string;
  icon: string;
  triggerText?: string;
}

export const questsData: QuestData[] = [
  {
    id: "htlc",
    title: "What is HTLC?",
    question: "What does HTLC stand for and why is it crucial for cross-chain swaps?",
    answer: `🔒 <strong>Hash-Time Lock Contract (HTLC)</strong><br><br>
HTLC is the security backbone of our cross-chain swaps:<br><br>
• <strong>Hash Lock:</strong> Your secret enables asset release on both chains<br>
• <strong>Time Lock:</strong> Automatic refund if swap doesn't complete<br>
• <strong>Atomic Property:</strong> Either both sides complete OR both refund<br><br>
Think of it as a digital escrow that only opens with the right key (your secret) and has an automatic return mechanism if something goes wrong!<br><br>
💡 <strong>Fun Fact:</strong> The same secret that unlocks your ETH also unlocks your SUI!`,
    icon: "🔐",
    triggerText: "Secure Swap"
  },
  {
    id: "dutch-auction",
    title: "How Does Dutch Auction Work?",
    question: "Why do swap rates change over time in our platform?",
    answer: `⏰ <strong>Dutch Auction Magic</strong><br><br>
Our platform uses decreasing rates to optimize your swap:<br><br>
• <strong>Start Rate:</strong> Higher rate (expensive for resolvers)<br>
• <strong>End Rate:</strong> Lower rate (cheaper for resolvers)<br>
• <strong>Time Decay:</strong> Rate decreases linearly over 5min-24h<br><br>
<strong>Why This Helps You:</strong><br>
✅ Better execution - resolvers compete for optimal timing<br>
✅ Fair pricing - market-driven rate discovery<br>
✅ Guaranteed fill - rate eventually becomes attractive<br><br>
<strong>Example:</strong> Your 0.001 ETH order starts expensive, gets filled when profitable for resolvers, ensuring you get your 100 SUI!`,
    icon: "📉",
    triggerText: "Rate Display"
  },
  {
    id: "resolvers",
    title: "What Are Resolvers?",
    question: "Who are resolvers and how do they help complete your swap?",
    answer: `🤖 <strong>Meet Your Swap Heroes: Resolvers</strong><br><br>
Resolvers are authorized participants who:<br><br>
• Monitor live auction rates across all orders<br>
• Fill your orders when rates become profitable<br>
• Transfer assets to you on both chains<br>
• Compete for the best execution timing<br><br>
<strong>The Process:</strong><br>
1. Multiple resolvers watch your order<br>
2. They calculate profitability vs current rates<br>
3. First profitable resolver fills (partially or fully)<br>
4. You receive assets automatically on destination chain<br><br>
💪 <strong>Network Effect:</strong> More resolvers = better rates + faster execution<br>
🏆 <strong>Quality Control:</strong> Only authorized, reputable resolvers participate`,
    icon: "🤖",
    triggerText: "Transaction History"
  },
  {
    id: "partial-fills",
    title: "Why Partial Fills?",
    question: "Why might your swap be completed by multiple resolvers instead of one?",
    answer: `⚡ <strong>Partial Fills = Better Liquidity</strong><br><br>
Your order can be filled in parts by different resolvers:<br><br>
• Resolver A fills 60% when rate hits their profit threshold<br>
• Resolver B fills remaining 40% at a different time<br>
• Both use the SAME SECRET - maintaining atomic security<br><br>
<strong>Benefits for You:</strong><br>
✅ Faster execution - don't wait for one big resolver<br>
✅ Better rates - multiple competition windows<br>
✅ Same security - atomic properties preserved<br>
✅ Higher success rate - smaller fills easier to match<br><br>
<strong>Security Note:</strong> All partial fills must use your original secret, preventing fragmentation attacks while enabling flexible execution!`,
    icon: "⚡",
    triggerText: "Multiple Transactions"
  },
  {
    id: "cross-chain",
    title: "Cross-Chain Coordination?",
    question: "How does the platform ensure your ETH and SUI move atomically across different blockchains?",
    answer: `🌉 <strong>Cross-Chain Atomic Bridge</strong><br><br>
Our system coordinates Ethereum & Sui perfectly:<br><br>
<strong>Coordination Mechanism:</strong><br>
• <strong>Same Secret:</strong> Unlocks escrows on both chains<br>
• <strong>Linked Time Locks:</strong> Synchronized expiration times<br>
• <strong>Event Monitoring:</strong> Real-time cross-chain updates<br>
• <strong>Atomic Guarantee:</strong> Both complete OR both refund<br><br>
<strong>The Flow:</strong><br>
1. 🔐 You create escrows on both chains with same hash lock<br>
2. 🤖 Resolver fills your ETH escrow using secret<br>
3. 🔗 Same secret now unlocks SUI escrow<br>
4. 🎯 Resolver claims SUI and transfers to you<br>
5. ✅ Atomic swap complete!<br><br>
<strong>Safety Net:</strong> If anything fails, time locks ensure automatic refunds on both chains - you never lose funds in limbo!`,
    icon: "🌉",
    triggerText: "Swap Confirmation"
  }
];

export const useQuests = () => {
  const [activeQuest, setActiveQuest] = useState<string | null>(null);
  const [discoveredQuests, setDiscoveredQuests] = useState<Set<string>>(new Set());

  const openQuest = useCallback((questId: string) => {
    setActiveQuest(questId);
    setDiscoveredQuests(prev => new Set([...prev, questId]));
  }, []);

  const closeQuest = useCallback(() => {
    setActiveQuest(null);
  }, []);

  const getQuest = useCallback((questId: string) => {
    return questsData.find(quest => quest.id === questId);
  }, []);

  return {
    activeQuest,
    discoveredQuests,
    openQuest,
    closeQuest,
    getQuest,
    questsData
  };
};