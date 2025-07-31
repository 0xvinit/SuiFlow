import { ChainKey, Chain, Token, chains, tokensByChain } from "@/data/swapData";

export const getCurrentChain = (
  selectedChain: ChainKey | null
): Chain | undefined => {
  if (!selectedChain) return undefined;
  return chains.find((c) => c.key === selectedChain);
};

export const getCurrentToken = (
  selectedChain: ChainKey | null,
  selectedToken: string
): Token | null => {
  if (!selectedChain) return null;
  return (
    tokensByChain[selectedChain].find((t) => t.name === selectedToken) || null
  );
};
