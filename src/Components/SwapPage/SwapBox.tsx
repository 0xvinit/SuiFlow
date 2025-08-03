"use client";
import { useState, useEffect, useRef } from "react";
import Image, { StaticImageData } from "next/image";
import { IoIosArrowDown } from "react-icons/io";
import { ChainKey, Chain, Token } from "@/data/swapData";
import { getCurrentChain, getCurrentToken } from "@/utils/swapUtils";
import { useTokenUSDValue } from "@/hooks/useTokenPrice";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useAddressBalance } from "@/hooks/useAddressBalance";
import { MultiChainConnect } from "../ConnectWallet/MultiChainConnect";

interface SwapBoxProps {
  boxNumber: 1 | 2;
  chains: Chain[];
  tokensByChain: Record<ChainKey, Token[]>;
  selectedChain: ChainKey | null;
  selectedToken: string;
  onChainSelect: (chain: ChainKey, box: 1 | 2) => void;
  onTokenSelect: (tokenName: string, box: 1 | 2) => void;
  isChainDisabled: (chainKey: ChainKey, box: 1 | 2) => boolean;
  defaultChainIcon: string | StaticImageData;
  defaultTokenIcon: string | StaticImageData;
  isWalletConnected?: boolean;
  walletAddress?: string | null;
  onConnectWallet?: () => void;
  onWalletAddressChange?: (address: string) => void;
  walletInputValue?: string;
  isAnimating?: boolean;
  convertedValue?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  // isLoading?: boolean;
}

const SwapBox = ({
  boxNumber,
  chains,
  tokensByChain,
  selectedChain,
  selectedToken,
  onChainSelect,
  onTokenSelect,
  isChainDisabled,
  defaultChainIcon,
  defaultTokenIcon,
  isWalletConnected,
  walletAddress,
  onWalletAddressChange,
  walletInputValue,
  convertedValue,
  inputValue: externalInputValue,
  onInputChange,
}: SwapBoxProps) => {
  const {
    evmWallet,
    suiWallet,
    isAnyWalletConnected,
    isWrongChain,
    switchToArbitrum,
    selectedEvmNetwork,
    SUPPORTED_NETWORKS,
  } = useMultiChainWallet();
  // Always call the hook, but only use the result for SwapBox1
  const {
    balance: walletBalance,
    symbol: balanceSymbol,
    isLoading: balanceLoading,
  } = useWalletBalance(selectedToken);
  
  // Hook for fetching balance of manually entered address (SwapBox2)
  const {
    balance: addressBalance,
    symbol: addressSymbol,
    isLoading: addressBalanceLoading,
    error: addressBalanceError,
  } = useAddressBalance(walletInputValue, selectedChain?.toString());
  
  // Use appropriate balance based on box number
  const balance = boxNumber === 1 ? walletBalance : addressBalance;
  const symbol = boxNumber === 1 ? balanceSymbol : addressSymbol;
  const isLoadingBalance = boxNumber === 1 ? balanceLoading : addressBalanceLoading;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localInputValue, setLocalInputValue] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedChainForConnection, setSelectedChainForConnection] =
    useState<ChainKey | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use external input value if provided, otherwise use local state
  const inputValue =
    externalInputValue !== undefined ? externalInputValue : localInputValue;
  const setInputValue = onInputChange || setLocalInputValue;

  const numericBalance = parseFloat(balance);
  const hasInsufficientBalance = Number(inputValue) > numericBalance;

  // Use token USD value hook
  const { usdValue, isLoading } = useTokenUSDValue(selectedToken, inputValue);
  const { usdValue: usdValue2, isLoading: isLoading2 } = useTokenUSDValue(
    selectedToken,
    convertedValue || "0"
  );

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleChainSelect = (chain: ChainKey) => {
    if (boxNumber === 2) {
      // SwapBox2: Don't allow manual chain selection, it's auto-determined
      setDropdownOpen(false);
      return;
    }

    if (!isChainDisabled(chain, boxNumber)) {
      const chainStatus = getChainWalletStatus(chain);

      if (chainStatus === "not-connected" && boxNumber === 1) {
        // Show wallet connection modal only for SwapBox1
        setSelectedChainForConnection(chain);
        setShowWalletModal(true);
        setDropdownOpen(false);
      } else {
        // Select the chain normally (only for SwapBox1)
        onChainSelect(chain, boxNumber);
        // Close dropdown after selecting
        setDropdownOpen(false);
      }
    }
  };

  // Determine if the selected chain matches the connected wallet
  const getChainWalletStatus = (chainKey: ChainKey) => {
    if (chainKey === "arbitrum") {
      if (evmWallet.connected && !isWrongChain) {
        return "connected";
      } else if (evmWallet.connected && isWrongChain) {
        return "wrong-chain";
      } else {
        return "not-connected";
      }
    } else if (chainKey === "sui") {
      return suiWallet.connected ? "connected" : "not-connected";
    }
    return "not-connected";
  };

  // Get display name and icon for current network based on connected wallet
  const getCurrentNetworkInfo = () => {
    if (boxNumber === 1) {
      // SwapBox1: Show connected wallet's network
      if (evmWallet.connected) {
        if (isWrongChain) {
          return { name: "Wrong Chain", icon: defaultChainIcon, status: "error" };
        }
        // Get the actual selected network name from the wallet hook
        const networkName = SUPPORTED_NETWORKS[selectedEvmNetwork]?.name;
        return {
          name: networkName || "Unknown Network",
          icon: getCurrentChain("arbitrum")?.icon || defaultChainIcon,
          status: "connected",
        };
      } else if (suiWallet.connected) {
        return {
          name: "Sui Network",
          icon: getCurrentChain("sui")?.icon || defaultChainIcon,
          status: "connected",
        };
      } 
      // Show selected chain if no wallet connected
      else if (selectedChain) {
        const chainData = getCurrentChain(selectedChain);
        return {
          name: chainData?.name || "Unknown",
          icon: chainData?.icon || defaultChainIcon,
          status: "not-connected",
        };
      }
      // Default state
      return { name: "Select Network", icon: defaultChainIcon, status: "none" };
    } else {
      // SwapBox2: Always show opposite network of SwapBox1
      if (evmWallet.connected && !isWrongChain) {
        // If EVM wallet connected, show Sui as opposite
        return {
          name: "Sui Network",
          icon: getCurrentChain("sui")?.icon || defaultChainIcon,
          status: "not-connected",
        };
      } else if (suiWallet.connected) {
        // If Sui wallet connected, show the selected Arbitrum network as opposite
        const networkName = SUPPORTED_NETWORKS[selectedEvmNetwork]?.name || "Arbitrum One";
        return {
          name: networkName,
          icon: getCurrentChain("arbitrum")?.icon || defaultChainIcon,
          status: "not-connected",
        };
      } else if (selectedChain) {
        // Show opposite of selected chain
        const oppositeChain = selectedChain === "arbitrum" ? "sui" : "arbitrum";
        const chainData = getCurrentChain(oppositeChain);
        return {
          name: chainData?.name || "Unknown",
          icon: chainData?.icon || defaultChainIcon,
          status: "not-connected",
        };
      }
      // Default: show Sui as default opposite
      return {
        name: "Sui Network",
        icon: getCurrentChain("sui")?.icon || defaultChainIcon,
        status: "not-connected",
      };
    }
  };

  const networkInfo = getCurrentNetworkInfo();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Auto-select chain when wallet connects successfully
  useEffect(() => {
    if (selectedChainForConnection && showWalletModal) {
      const chainStatus = getChainWalletStatus(selectedChainForConnection);
      if (chainStatus === "connected") {
        // Wallet connected successfully, select the chain
        onChainSelect(selectedChainForConnection, boxNumber);
        setShowWalletModal(false);
        setSelectedChainForConnection(null);
      }
    }
  }, [
    evmWallet.connected,
    suiWallet.connected,
    selectedChainForConnection,
    showWalletModal,
    onChainSelect,
    boxNumber,
  ]);

  // Sync selected chain with connected wallet
  useEffect(() => {
    if (boxNumber === 1) {
      // SwapBox1: Sync with connected wallet
      if (evmWallet.connected && !isWrongChain) {
        // Auto-select Arbitrum when EVM wallet is connected
        if (selectedChain !== "arbitrum") {
          onChainSelect("arbitrum", boxNumber);
        }
      } else if (suiWallet.connected) {
        // Auto-select Sui when Sui wallet is connected
        if (selectedChain !== "sui") {
          onChainSelect("sui", boxNumber);
        }
      }
    } else {
      // SwapBox2: Auto-select opposite chain
      if (evmWallet.connected && !isWrongChain) {
        // If EVM wallet connected (SwapBox1 = Arbitrum), set SwapBox2 = Sui
        if (selectedChain !== "sui") {
          onChainSelect("sui", boxNumber);
        }
      } else if (suiWallet.connected) {
        // If Sui wallet connected (SwapBox1 = Sui), set SwapBox2 = Arbitrum
        if (selectedChain !== "arbitrum") {
          onChainSelect("arbitrum", boxNumber);
        }
      }
    }
    // Note: We don't auto-deselect when wallet disconnects to preserve user selection
  }, [evmWallet.connected, suiWallet.connected, isWrongChain, selectedChain, onChainSelect, boxNumber, selectedEvmNetwork]);

  const handleTokenSelect = (tokenName: string) => {
    // Check if the token is enabled before selecting
    const token = selectedChain ? tokensByChain[selectedChain].find(t => t.name === tokenName) : null;
    if (token && token.enabled) {
      onTokenSelect(tokenName, boxNumber);
      // Close dropdown after selecting token
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (showWalletModal) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [showWalletModal]);

  return (
    <>
      <div className="border border-white/20 rounded-2xl bg-[#17191a] w-[350px] xl:w-[400px] relative">
        <div className="border-4 border-black/80 rounded-2xl p-3 xl:p-5 pb-6 xl:pb-8 h-full w-full">
          <div className="bg-black rounded-2xl p-1.5 relative grid-pattern">
            <div className="w-full h-full rounded-2xl border border-[#84d46c] relative p-4 xl:p-6 text-white">
              {boxNumber === 1 && (
                <div className="flex justify-end mb-2 text-[22px]">
                  Balance:{" "}
                  {isLoadingBalance
                    ? "Loading..."
                    : `${balance} ${symbol}`}
                </div>
              )}
              {boxNumber === 2 && (
                <div className="flex justify-end mb-2 text-[22px]">
                  Balance:{" "}
                  {addressBalanceError ? (
                    <span className="text-red-400">Invalid Address</span>
                  ) : isLoadingBalance ? (
                    "Loading..."
                  ) : (
                    `${balance} ${symbol}`
                  )}
                </div>
              )}

              {/* Network Selection Button */}
              <div className="relative dropdown-container" ref={dropdownRef}>
                <div
                  className={`border rounded-md p-1.5 xl:p-2 mb-2 xl:mb-3 text-white/95 flex gap-2 items-center justify-between cursor-pointer transition-all ${
                    networkInfo.status === "error"
                      ? "border-red-500 bg-red-900/20 hover:bg-red-900/30"
                      : networkInfo.status === "connected"
                      ? "border-[#84d46c]/50 bg-[#84d46c]/10 hover:bg-[#84d46c]/20"
                      : "border-white/20 bg-[#17191a] opacity-70 hover:opacity-90"
                  }`}
                  onClick={toggleDropdown}
                >
                  <div className="flex items-center gap-2 text-[23px]">
                    <Image
                      src={networkInfo.icon}
                      alt={networkInfo.name}
                      className="size-6"
                    />
                    <span
                      className={
                        networkInfo.status === "error" ? "text-red-400" : ""
                      }
                    >
                      {networkInfo.name}
                      {networkInfo.status === "error" && " ⚠️"}
                      {networkInfo.status === "connected"}
                      <sub className="text-sm text-white/70 ml-1">
                        {selectedToken ? `(${selectedToken})` : "(Token)"}
                      </sub>
                    </span>
                  </div>
                  <IoIosArrowDown
                    className={`transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div 
                    className="absolute top-full left-0 right-0 z-50 bg-[#1c1f20] border border-[#84d46c]/20 rounded-lg shadow-lg mt-1 p-3 text-[22px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Network Selection */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-[#84d46c] mb-2">
                        {boxNumber === 1 ? "Select Network" : "Destination Network"}
                      </h3>
                      {boxNumber === 2 && (
                        <p className="text-white/60 text-sm mb-3">
                          Network is automatically set to the opposite of your connected wallet
                        </p>
                      )}
                      <div className="flex gap-2">
                        {chains.map((chain) => {
                          const chainStatus = getChainWalletStatus(
                            chain.key as ChainKey
                          );
                          return (
                            <div key={chain.key} className="relative">
                              <div
                                onClick={() =>
                                  handleChainSelect(chain.key as ChainKey)
                                }
                                className={`flex flex-col items-center p-2 w-20 rounded-lg border cursor-pointer transition ${
                                  selectedChain === chain.key
                                    ? "border-[#84d46c] bg-[#84d46c]/10"
                                    : isChainDisabled(
                                        chain.key as ChainKey,
                                        boxNumber
                                      )
                                    ? "border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50"
                                    : "border-transparent hover:border-[#84d46c]/50 hover:bg-[#84d46c]/10"
                                }`}
                              >
                                <Image
                                  src={chain.icon}
                                  alt={chain.name}
                                  className="w-8 h-8 mb-1"
                                />
                                <span className="text-[20px] text-white/90">
                                  {chain.name}
                                </span>
                                {/* Status indicator */}
                                <div className="absolute -top-1 -right-1">
                                  {chainStatus === "connected" && (
                                    <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-[#1c1f20]" />
                                  )}
                                  {chainStatus === "wrong-chain" && (
                                    <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-[#1c1f20]" />
                                  )}
                                  {chainStatus === "not-connected" && (
                                    <div className="w-3 h-3 bg-gray-500 rounded-full border-2 border-[#1c1f20]" />
                                  )}
                                </div>
                              </div>

                              {/* Show switch button for wrong chain only */}
                              {selectedChain === chain.key &&
                                chainStatus === "wrong-chain" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      switchToArbitrum();
                                      setDropdownOpen(false);
                                    }}
                                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors z-10"
                                  >
                                    Switch
                                  </button>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Token Selection */}
                    <div>
                      {selectedChain && (
                        <>
                          <h3 className="text-[22px] font-semibold text-[#84d46c] mb-2">
                            Select Token
                          </h3>
                          <div className="space-y-1">
                            {/* {selectedChain && */}
                            {tokensByChain[selectedChain].map((token) => (
                              <div
                                key={token.name}
                                onClick={() => token.enabled && handleTokenSelect(token.name)}
                                className={`flex items-center gap-3 p-2 rounded-lg transition relative ${
                                  !token.enabled
                                    ? "opacity-50 cursor-not-allowed bg-gray-800/30"
                                    : selectedToken === token.name
                                    ? "bg-[#84d46c]/10 border border-[#84d46c]/50 cursor-pointer"
                                    : "hover:bg-[#84d46c]/10 hover:border hover:border-[#84d46c]/30 cursor-pointer"
                                }`}
                              >
                                <Image
                                  src={token.icon}
                                  alt={token.name}
                                  className="w-5 h-5"
                                />
                                <span className="text-white/90 text-[20px]">
                                  {token.name}
                                </span>
                                {!token.enabled && (
                                  <span className="text-xs text-gray-400 ml-auto">
                                    Coming Soon
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                <div className="relative bg-black border border-white/10 rounded-full size-12 flex items-center justify-center z-10">
                  {getCurrentToken(selectedChain, selectedToken) ? (
                    <Image
                      src={
                        getCurrentToken(selectedChain, selectedToken)?.icon ||
                        defaultTokenIcon
                      }
                      alt="Main"
                      className="size-7 z-10"
                    />
                  ) : (
                    <div className="size-7 z-10 bg-gray-600 rounded-full" />
                  )}
                  {getCurrentChain(selectedChain) && (
                    <Image
                      src={
                        getCurrentChain(selectedChain)?.icon || defaultChainIcon
                      }
                      alt="Badge"
                      className="border-2 border-[#17191a] absolute right-1 bottom-1 rounded-full size-4 z-20"
                    />
                  )}
                </div>
              </div>

              {/* <div className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 text-white/95 flex gap-2 items-center justify-between">
              <span className="text-white/70">
                {selectedToken ? selectedToken : "Select Token"}
              </span>
              <span className="text-xs text-white/50">
                0xbb4c2bab6b2de45f9c...
              </span>
            </div> */}
              {boxNumber === 1 ? (
                <div>
                  <div
                    className={`border ${
                      hasInsufficientBalance
                        ? "border-red-500"
                        : "border-white/20"
                    } bg-[#17191a] opacity-70 rounded-md p-1.5 xl:p-2 text-white/95 flex items-center justify-between gap-3`}
                  >
                    {/* Token Image */}
                    <div className="flex items-center gap-2 w-1/2">
                      {getCurrentToken(selectedChain, selectedToken)?.icon ? (
                        <Image
                          src={
                            getCurrentToken(selectedChain, selectedToken)!.icon
                          }
                          alt={selectedToken || "Token"}
                          className="w-6 h-6"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-600 aspect-square rounded-full" />
                      )}
                      <input
                        type="number"
                        placeholder="0.00"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        // className="bg-transparent text-white text-[22px] outline-none w-full"
                        className="bg-transparent text-white text-[22px] outline-none w-full appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* USD Value */}
                    <div className="text-right">
                      <div className="text-white/50 text-lg">
                        {isLoading ? "Loading..." : `~$${usdValue.toFixed(2)}`}
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {hasInsufficientBalance && (
                    <p className="text-red-500 text-lg ml-1">
                      Insufficient balance
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-1.5 xl:p-2 text-white/95 flex items-center justify-between gap-3">
                  {/* Token Image and Static Value */}
                  <div className="flex items-center gap-2 w-1/2">
                    {getCurrentToken(selectedChain, selectedToken)?.icon ? (
                      <Image
                        src={
                          getCurrentToken(selectedChain, selectedToken)!.icon
                        }
                        alt={selectedToken || "Token"}
                        className="w-6 h-6"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-600 aspect-square rounded-full" />
                    )}
                    <span className="text-[22px] text-white">
                      {convertedValue}
                    </span>
                  </div>

                  {/* USD Value */}
                  <div className="text-right">
                    {/* <div className="text-white/80 text-sm">{selectedToken || 'Token'}</div> */}
                    <div className="text-white/50 text-lg">
                      {isLoading2 ? "Loading..." : `~$${usdValue2.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {boxNumber === 1 ? (
            <div className="mt-8 flex justify-center">
              {isAnyWalletConnected ? (
                <div className="flex flex-col w-full">
                  <p className="text-white/70 mb-2 ml-2 text-[24px]">
                    Connected Wallet
                  </p>
                  <input
                    className="w-full text-[22px] px-3 py-2 rounded-2xl bg-black text-white/80 border border-[#84d46c]/50"
                    value={
                      evmWallet.connected
                        ? evmWallet.address
                        : suiWallet.connected
                        ? suiWallet.address
                        : ""
                    }
                    readOnly
                  />
                </div>
              ) : (
                <div className="text-center text-white/70 text-[18px] px-4">
                  <p className="mb-2 text-[24px] text-white">
                    No Wallet Connected
                  </p>
                  <p className="text-[20px] mb-4">
                    Select a network above to connect your wallet
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 flex flex-col w-full">
              <p className="text-white/70 mb-2 ml-2 text-[24px]">
                Enter Wallet Address
              </p>
              <input
                className="w-full text-[22px] px-3 py-2 rounded-2xl bg-black text-white/80 border border-[#84d46c]/50"
                value={walletInputValue || ""}
                onChange={(e) => onWalletAddressChange?.(e.target.value)}
                placeholder="0x..."
              />
            </div>
          )}
        </div>
      </div>
      {/* Wallet Connection Modal - Only show in SwapBox1 */}
      {boxNumber === 1 && showWalletModal && selectedChainForConnection && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/80 flex items-center justify-center h-screen">
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#17191a] border border-[#84d46c]/20 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-3xl font-vt323 text-white tracking-wider mb-2">
                Connect {getCurrentChain(selectedChainForConnection)?.name}{" "}
                Wallet
              </h3>
              <p className="text-gray-400 font-vt323 text-lg">
                Connect your wallet to start using{" "}
                {getCurrentChain(selectedChainForConnection)?.name} network
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <Image
                src={
                  getCurrentChain(selectedChainForConnection)?.icon ||
                  defaultChainIcon
                }
                alt={
                  getCurrentChain(selectedChainForConnection)?.name || "Network"
                }
                className="w-16 h-16"
              />
            </div>

            <div className="text-center mb-6">
              <p className="text-white/80 text-lg font-vt323">
                Click on the{" "}
                <span className="text-[#84d46c]">Connect Wallet</span> button at
                the top-right corner to switch your network.
              </p>
            </div>

            <button
              onClick={() => {
                setShowWalletModal(false);
                setSelectedChainForConnection(null);
              }}
              className="w-full py-3 bg-[#1c1f20] hover:bg-[#84d46c]/10 cursor-pointer text-white rounded-xl font-vt323 text-[20px] tracking-wider transition-colors border border-[#84d46c]/30"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SwapBox;
