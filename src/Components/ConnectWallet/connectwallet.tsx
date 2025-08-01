"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  FaWallet,
  FaTimes,
  FaEthereum,
  FaCoins,
  FaChrome,
  FaInfoCircle,
} from "react-icons/fa";
import {
  SiWalletconnect,
  SiCoinbase,
  SiBrave,
  SiOpera,
  SiFirefox,
  SiFantom,
  SiRust,
  SiOkx,
} from "react-icons/si";
import { TbBrandSafari, TbBrandEdge, TbBackpack } from "react-icons/tb";
import ChainSelector from "./ChainSelector";

// Wallet data for EVM chains with proper connector names
const evmWallets = [
  {
    name: "MetaMask",
    icon: FaWallet,
    description: "Popular Ethereum wallet",
    connector: "metamask",
    type: "evm",
  },
  {
    name: "WalletConnect",
    icon: SiWalletconnect,
    description: "Multi-wallet connection",
    connector: "walletconnect",
    type: "evm",
  },
  {
    name: "Coinbase Wallet",
    icon: SiCoinbase,
    description: "Coinbase exchange wallet",
    connector: "coinbase",
    type: "evm",
  },
  {
    name: "Brave Wallet",
    icon: SiBrave,
    description: "Built into Brave browser",
    connector: "metamask", // Brave uses MetaMask connector
    type: "evm",
  },
  {
    name: "Opera Wallet",
    icon: SiOpera,
    description: "Built into Opera browser",
    connector: "metamask", // Opera uses MetaMask connector
    type: "evm",
  },
  {
    name: "Safari Wallet",
    icon: TbBrandSafari,
    description: "Built into Safari browser",
    connector: "walletconnect",
    type: "evm",
  },
  {
    name: "Edge Wallet",
    icon: TbBrandEdge,
    description: "Built into Edge browser",
    connector: "metamask", // Edge uses MetaMask connector
    type: "evm",
  },
  {
    name: "Firefox Wallet",
    icon: SiFirefox,
    description: "Built into Firefox browser",
    connector: "walletconnect",
    type: "evm",
  },
  {
    name: "Chrome Wallet",
    icon: FaChrome,
    description: "Built into Chrome browser",
    connector: "metamask", // Chrome uses MetaMask connector
    type: "evm",
  },
];

// Wallet data for SUI - specific wallets as requested
const suiWallets = [
  {
    name: "Phantom",
    icon: SiFantom,
    description: "Popular Solana & SUI wallet",
    connector: "phantom",
    type: "sui",
  },
  {
    name: "Backpack",
    icon: TbBackpack,
    description: "Multi-chain wallet",
    connector: "backpack",
    type: "sui",
  },
  {
    name: "Trust Wallet",
    icon: SiRust,
    description: "Binance's multi-chain wallet",
    connector: "trust",
    type: "sui",
  },
  {
    name: "OKX Wallet",
    icon: SiOkx,
    description: "OKX exchange wallet",
    connector: "okx",
    type: "sui",
  },
];

export default function ConnectWallet() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"evm" | "sui">("evm");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { login, ready, authenticated, user, logout } = usePrivy();

  // Check if user is authenticated and close modal
  useEffect(() => {
    if (authenticated && isOpen) {
      setIsOpen(false);
      setConnectionError(null);
    }
  }, [authenticated, isOpen]);

  const handleWalletSelect = async (
    walletName: string,
    connector: string,
    walletType: string
  ) => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      if (walletType === "sui") {
        // For SUI wallets, provide specific instructions
        console.log(`Connecting to SUI wallet: ${walletName}`);

        // Show Privy's modal but with instructions for SUI wallet
        await login();

        // After connection, we'll need to verify it's actually a SUI wallet
        // This will be handled in the useEffect that detects the wallet type
      } else {
        // For EVM wallets, use the default login
        await login();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setConnectionError("Connection failed. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const closeModal = () => {
    if (!isConnecting) {
      setIsOpen(false);
      setConnectionError(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      console.log("Successfully disconnected wallet");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  // Get wallet address for display
  const getWalletAddress = () => {
    if (authenticated && user?.wallet?.address) {
      return `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(
        -4
      )}`;
    }
    return "";
  };

  // Get button text
  const getButtonText = () => {
    if (authenticated && user?.wallet?.address) {
      return getWalletAddress();
    }
    return "Connect Wallet";
  };

  return (
    <>
      <div className="flex items-center gap-3 font-vt323 tracking-wider">
        {/* Chain Selector */}
        <ChainSelector isConnected={authenticated} />

        {/* Connect/Disconnect Button */}
        <div className="relative inline-block text-left">
          <button
            onClick={() =>
              authenticated ? handleDisconnect() : setIsOpen(true)
            }
            className="px-8 py-2 rounded-full text-black font-semibold bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase w-fit text-[20px]"
          >
            {getButtonText()}
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-[#84d46c]/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#84d46c]/20">
              <h2 className="text-3xl font-bold text-white font-vt323 tracking-wider">
                Connect Wallet
              </h2>
              <button
                onClick={closeModal}
                disabled={isConnecting}
                className="text-gray-400 hover:text-[#84d46c] transition-colors disabled:opacity-50"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#84d46c]/20">
              <button
                onClick={() => setActiveTab("evm")}
                disabled={isConnecting}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors text-[22px] ${
                  activeTab === "evm"
                    ? "text-[#84d46c] border-b-2 border-[#84d46c] bg-[#84d46c]/10"
                    : "text-gray-400 hover:text-white"
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaEthereum size={18} />
                  <span className="font-vt323 tracking-wider">EVM</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("sui")}
                disabled={isConnecting}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-colors text-[22px] ${
                  activeTab === "sui"
                    ? "text-[#84d46c] border-b-2 border-[#84d46c] bg-[#84d46c]/10"
                    : "text-gray-400 hover:text-white"
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaCoins size={18} />
                  <span className="font-vt323 tracking-wider">SUI</span>
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              {connectionError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm font-vt323 tracking-wider">
                    {connectionError}
                  </p>
                </div>
              )}

              {isConnecting ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84d46c] mb-4"></div>
                  <p className="text-gray-300 font-vt323 tracking-wider">
                    Opening wallet selection...
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-vt323 tracking-wider">
                    Please select your preferred wallet from the popup
                  </p>
                </div>
              ) : activeTab === "evm" ? (
                <div className="space-y-4">
                  {/* Instructions */}
                  <div className="bg-[#84d46c]/10 border border-[#84d46c]/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle
                        className="text-[#84d46c] mt-1 flex-shrink-0"
                        size={16}
                      />
                      <div>
                        <h3 className="font-semibold text-[#84d46c] font-vt323 tracking-wider mb-1 text-[22px]">
                          Choose Your EVM Wallet
                        </h3>
                        <p className="text-base text-gray-300 font-vt323 tracking-wider">
                          Click on any wallet below to open the wallet selection
                          popup. Choose from MetaMask, WalletConnect, Coinbase
                          Wallet, or other EVM-compatible wallets.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-base text-gray-400 font-vt323 tracking-wider">
                    Select your preferred EVM wallet:
                  </p>

                  {evmWallets.map((wallet, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleWalletSelect(
                          wallet.name,
                          wallet.connector,
                          wallet.type
                        )
                      }
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-700 hover:border-[#84d46c]/50 hover:bg-[#84d46c]/5 transition-all duration-200 group"
                    >
                      <div className="flex-shrink-0">
                        <wallet.icon
                          size={24}
                          className="text-gray-400 group-hover:text-[#84d46c] transition-colors"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-white font-vt323 tracking-wider text-[22px]">
                          {wallet.name}
                        </h3>
                        <p className="text-sm text-gray-400 font-vt323 tracking-wider">
                          {wallet.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-gray-600 rounded-full group-hover:bg-[#84d46c] transition-colors"></div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Instructions */}
                  <div className="bg-[#84d46c]/10 border border-[#84d46c]/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle
                        className="text-[#84d46c] mt-1 flex-shrink-0"
                        size={16}
                      />
                      <div>
                        <h3 className="font-semibold text-[#84d46c] font-vt323 tracking-wider mb-1 text-[22px]">
                          Choose Your SUI Wallet
                        </h3>
                        <p className="text-base text-gray-300 font-vt323 tracking-wider">
                          Click on any wallet below to open the wallet selection
                          popup. Look for <strong>Phantom</strong>,{" "}
                          <strong>Backpack</strong>,{" "}
                          <strong>Trust Wallet</strong>, or{" "}
                          <strong>OKX Wallet</strong> in the popup. Make sure to
                          select the SUI network in your wallet.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-base text-gray-400 font-vt323 tracking-wider">
                    Select your preferred SUI wallet:
                  </p>

                  {suiWallets.map((wallet, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleWalletSelect(
                          wallet.name,
                          wallet.connector,
                          wallet.type
                        )
                      }
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-700 hover:border-[#84d46c]/50 hover:bg-[#84d46c]/5 transition-all duration-200 group"
                    >
                      <div className="flex-shrink-0">
                        <wallet.icon
                          size={24}
                          className="text-gray-400 group-hover:text-[#84d46c] transition-colors"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-white font-vt323 tracking-wider text-[22px]">
                          {wallet.name}
                        </h3>
                        <p className="text-sm text-gray-400 font-vt323 tracking-wider">
                          {wallet.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-gray-600 rounded-full group-hover:bg-[#84d46c] transition-colors"></div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#84d46c]/20 bg-[#1a1a1a]">
              <p className="text-sm text-gray-500 text-center font-vt323 tracking-wider">
                By connecting your wallet, you agree to our Terms of Service and
                Privacy Policy
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
