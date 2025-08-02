import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

export interface Chain {
  id: number | string;
  name: string;
  description: string;
  rpcUrl: string;
  explorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export function useChainDetection() {
  const [currentChain, setCurrentChain] = useState<Chain | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { user, authenticated } = usePrivy();

  const detectCurrentChain = async () => {
    if (!authenticated || !user?.wallet) return null;

    setIsDetecting(true);
    try {
      // Try to get the current chain ID from the wallet
      const ethereum = (window as any).ethereum;
      if (ethereum && typeof ethereum.request === "function") {
        const chainId = await ethereum.request({ method: "eth_chainId" });
        const chainIdDecimal = parseInt(chainId, 16);

        // You can expand this with your chain list
        const knownChains: Chain[] = [
          {
            id: 1,
            name: "Ethereum",
            description: "Ethereum Mainnet",
            rpcUrl: "https://mainnet.infura.io/v3/",
            explorer: "https://etherscan.io",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          },
          {
            id: 137,
            name: "Polygon",
            description: "Polygon Mainnet",
            rpcUrl: "https://polygon-rpc.com",
            explorer: "https://polygonscan.com",
            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
          },
          // Add more chains as needed
        ];

        const chain = knownChains.find((c) => c.id === chainIdDecimal);
        if (chain) {
          setCurrentChain(chain);
          return chain;
        }
      }
    } catch (error) {
      console.error("Error detecting chain:", error);
    } finally {
      setIsDetecting(false);
    }
    return null;
  };

  const switchChain = async (chain: Chain) => {
    if (!authenticated || !user?.wallet) return false;

    try {
      const ethereum = (window as any).ethereum;
      if (ethereum && typeof ethereum.request === "function") {
        const chainId = `0x${
          typeof chain.id === "number" ? chain.id.toString(16) : chain.id
        }`;

        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId }],
          });
          setCurrentChain(chain);
          return true;
        } catch (switchError: any) {
          // If chain is not added to wallet, add it
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId,
                    chainName: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: [chain.rpcUrl],
                    blockExplorerUrls: [chain.explorer],
                  },
                ],
              });
              setCurrentChain(chain);
              return true;
            } catch (addError) {
              console.error("Failed to add chain:", addError);
              return false;
            }
          } else {
            console.error("Failed to switch chain:", switchError);
            return false;
          }
        }
      }
    } catch (error) {
      console.error("Failed to switch chain:", error);
      return false;
    }
    return false;
  };

  useEffect(() => {
    if (authenticated) {
      detectCurrentChain();
    } else {
      setCurrentChain(null);
    }
  }, [authenticated, user]);

  return {
    currentChain,
    isDetecting,
    detectCurrentChain,
    switchChain,
  };
}
