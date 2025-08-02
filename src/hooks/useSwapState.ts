import { useState } from "react";
import { ChainKey, tokensByChain } from "@/data/swapData";

export const useSwapState = () => {
  // State for both swap boxes
  const [selectedChain1, setSelectedChain1] = useState<ChainKey | null>(null);
  const [selectedChain2, setSelectedChain2] = useState<ChainKey | null>(null);
  const [selectedToken1, setSelectedToken1] = useState<string>("");
  const [selectedToken2, setSelectedToken2] = useState<string>("");
  const [inputValue1, setInputValue1] = useState<string>("");

  const selectChain = (chain: ChainKey, box: 1 | 2) => {
    // Find the first enabled token for the selected chain
    const firstEnabledToken = tokensByChain[chain].find(token => token.enabled);
    const defaultTokenName = firstEnabledToken ? firstEnabledToken.name : tokensByChain[chain][0].name;
    
    if (box === 1) {
      setSelectedChain1(chain);
      // Reset token to first enabled token for the new chain
      setSelectedToken1(defaultTokenName);
    } else {
      setSelectedChain2(chain);
      // Reset token to first enabled token for the new chain
      setSelectedToken2(defaultTokenName);
    }
  };

  const selectToken = (tokenName: string, box: 1 | 2) => {
    // Check if the token is enabled before selecting
    const currentChain = box === 1 ? selectedChain1 : selectedChain2;
    if (currentChain) {
      const token = tokensByChain[currentChain].find(t => t.name === tokenName);
      if (token && token.enabled) {
        if (box === 1) {
          setSelectedToken1(tokenName);
        } else {
          setSelectedToken2(tokenName);
        }
      }
    }
  };

  const setInputValue = (value: string, box: 1 | 2) => {
    if (box === 1) {
      setInputValue1(value);
    }
  };

  // Check if a chain is disabled (selected in other box)
  const isChainDisabled = (chainKey: ChainKey, box: 1 | 2) => {
    if (box === 1) {
      return selectedChain2 === chainKey;
    } else {
      return selectedChain1 === chainKey;
    }
  };

  return {
    selectedChain1,
    selectedChain2,
    selectedToken1,
    selectedToken2,
    inputValue1,
    selectChain,
    selectToken,
    setInputValue,
    isChainDisabled,
  };
};
