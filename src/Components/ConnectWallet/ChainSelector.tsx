"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  FaEthereum,
  FaCoins,
  FaChevronDown,
  FaNetworkWired,
} from "react-icons/fa";
import { SiPolygon, SiBinance, SiOptimism } from "react-icons/si";

interface ChainSelectorProps {
  isConnected: boolean;
}

// Popular EVM chains
const evmChains = [
  {
    id: 1,
    name: "Ethereum",
    icon: FaEthereum,
    description: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/",
    explorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  {
    id: 137,
    name: "Polygon",
    icon: SiPolygon,
    description: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    explorer: "https://polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
  {
    id: 56,
    name: "BSC",
    icon: SiBinance,
    description: "Binance Smart Chain",
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorer: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  },
  {
    id: 42161,
    name: "Arbitrum",
    icon: FaNetworkWired,
    description: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  {
    id: 10,
    name: "Optimism",
    icon: SiOptimism,
    description: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    explorer: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  {
    id: 43114,
    name: "Avalanche",
    icon: FaNetworkWired,
    description: "Avalanche C-Chain",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorer: "https://snowtrace.io",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  },
];

// SUI chain
const suiChain = {
  id: "sui",
  name: "Sui",
  icon: FaCoins,
  description: "Sui Network",
  rpcUrl: "https://fullnode.mainnet.sui.io",
  explorer: "https://suiexplorer.com",
  nativeCurrency: { name: "SUI", symbol: "SUI", decimals: 9 },
};

export default function ChainSelector({ isConnected }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentChain, setCurrentChain] = useState<typeof evmChains[0] | typeof suiChain | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, authenticated } = usePrivy();

  // Check if user is using a SUI wallet
  const isSuiWallet = () => {
    if (!user?.wallet?.walletClientType) return false;
    const suiWallets = ["phantom", "backpack", "trust", "okx"];
    return suiWallets.includes(user.wallet.walletClientType.toLowerCase());
  };

  // Detect current chain from wallet
  useEffect(() => {
    const detectCurrentChain = async () => {
      if (!authenticated || !user?.wallet) return;

      try {
        // Check if user is using a SUI wallet
        if (isSuiWallet()) {
          setCurrentChain(suiChain);
        } else {
          // For EVM wallets, default to Arbitrum (chain ID 42161)
          const arbitrumChain = evmChains.find((chain) => chain.id === 42161);
          setCurrentChain(arbitrumChain || evmChains[0]);
        }
      } catch (error) {
        console.error("Error detecting chain:", error);
        // Default to Arbitrum for EVM wallets, SUI for SUI wallets
        if (isSuiWallet()) {
          setCurrentChain(suiChain);
        } else {
          const arbitrumChain = evmChains.find((chain) => chain.id === 42161);
          setCurrentChain(arbitrumChain || evmChains[0]);
        }
      }
    };

    detectCurrentChain();
  }, [authenticated, user, isSuiWallet]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleChainSwitch = async (chain: typeof evmChains[0] | typeof suiChain) => {
    if (!authenticated || !user?.wallet) return;

    // Check if the chain is allowed for the current wallet type
    if (isSuiWallet() && chain.id !== "sui") {
      console.log("SUI wallet can only use SUI chain");
      return;
    }

    if (!isSuiWallet() && chain.id === "sui") {
      console.log("EVM wallet cannot use SUI chain");
      return;
    }

    // For EVM wallets, only allow Arbitrum
    if (!isSuiWallet() && chain.id !== 42161) {
      console.log("Only Arbitrum is allowed for EVM wallets");
      return;
    }

    try {
      setIsSwitching(true);

      if (chain.id === "sui") {
        // Handle SUI chain switch
        console.log("Switching to SUI chain");
        setCurrentChain(suiChain);
      } else {
        // Handle EVM chain switch (only Arbitrum)
        const chainId = `0x${chain.id.toString(16)}`;

        try {
          // Try to access the wallet's provider through window.ethereum
          const ethereum = (window as any)?.ethereum;
          if (ethereum && typeof ethereum.request === "function") {
            await ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId }],
            });
            setCurrentChain(chain);
          } else {
            // Fallback: just update the UI state
            setCurrentChain(chain);
            console.log(`Switched to ${chain.name} (UI only)`);
          }
        } catch (switchError: unknown) {
          // If chain is not added to wallet, add it
          if ((switchError as any)?.code === 4902) {
            try {
              const ethereum = (window as any)?.ethereum;
              if (ethereum) {
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
              } else {
                setCurrentChain(chain);
              }
            } catch (addError) {
              console.error("Failed to add chain:", addError);
              // Still update UI state
              setCurrentChain(chain);
            }
          } else {
            console.error("Failed to switch chain:", switchError);
            // Still update UI state
            setCurrentChain(chain);
          }
        }
      }
    } catch (error) {
      console.error("Failed to switch chain:", error);
      // You might want to show an error toast here
    } finally {
      setIsSwitching(false);
      setIsOpen(false);
    }
  };

  if (!isConnected || !currentChain) {
    return null;
  }

  const CurrentChainIcon = currentChain.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-black font-semibold bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase text-[16px] font-vt323 tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CurrentChainIcon size={16} />
        <span>{currentChain.name}</span>
        <FaChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-xl shadow-2xl border border-[#84d46c]/20 z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {/* EVM Chains Section */}
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 font-vt323 tracking-wider uppercase">
                EVM Chains
              </div>
              {evmChains.map((chain) => {
                const ChainIcon = chain.icon;
                const isDisabled =
                  isSuiWallet() || (!isSuiWallet() && chain.id !== 42161);
                const isActive = currentChain.id === chain.id;

                return (
                  <button
                    key={chain.id}
                    onClick={() => !isDisabled && handleChainSwitch(chain)}
                    disabled={isSwitching || isDisabled}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                      isActive
                        ? "bg-[#84d46c]/20 text-[#84d46c] border border-[#84d46c]/30"
                        : isDisabled
                        ? "text-gray-500 cursor-not-allowed opacity-50"
                        : "text-gray-300 hover:bg-[#84d46c]/10 hover:text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ChainIcon
                      size={16}
                      className={isDisabled ? "opacity-50" : ""}
                    />
                    <div className="flex-1">
                      <div className="font-semibold font-vt323 tracking-wider text-[14px]">
                        {chain.name}
                      </div>
                      <div className="text-xs text-gray-400 font-vt323 tracking-wider">
                        {chain.description}
                      </div>
                      {isDisabled && (
                        <div className="text-xs text-red-400 font-vt323 tracking-wider mt-1">
                          {isSuiWallet()
                            ? "Not available for SUI wallet"
                            : "Not available"}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-[#84d46c] rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* SUI Chain Section */}
            <div className="border-t border-gray-700 pt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 font-vt323 tracking-wider uppercase">
                Other Chains
              </div>
              <button
                onClick={() => !isSuiWallet() && handleChainSwitch(suiChain)}
                disabled={isSwitching || !isSuiWallet()}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                  currentChain.id === suiChain.id
                    ? "bg-[#84d46c]/20 text-[#84d46c] border border-[#84d46c]/30"
                    : !isSuiWallet()
                    ? "text-gray-500 cursor-not-allowed opacity-50"
                    : "text-gray-300 hover:bg-[#84d46c]/10 hover:text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <suiChain.icon
                  size={16}
                  className={!isSuiWallet() ? "opacity-50" : ""}
                />
                <div className="flex-1">
                  <div className="font-semibold font-vt323 tracking-wider text-[14px]">
                    {suiChain.name}
                  </div>
                  <div className="text-xs text-gray-400 font-vt323 tracking-wider">
                    {suiChain.description}
                  </div>
                  {!isSuiWallet() && (
                    <div className="text-xs text-red-400 font-vt323 tracking-wider mt-1">
                      Only available for SUI wallets
                    </div>
                  )}
                </div>
                {currentChain.id === suiChain.id && (
                  <div className="w-2 h-2 bg-[#84d46c] rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isSwitching && (
        <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#84d46c]"></div>
        </div>
      )}
    </div>
  );
}
