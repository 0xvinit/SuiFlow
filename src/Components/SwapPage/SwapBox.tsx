"use client";
import { useState } from "react";
import Image from "next/image";
import { IoIosArrowDown } from "react-icons/io";
import { ChainKey, Chain, Token } from "@/data/swapData";
import { getCurrentChain, getCurrentToken } from "@/utils/swapUtils";
import ConnectWalletButton from "../ConnectWallet/connectwallet";

interface SwapBoxProps {
  boxNumber: 1 | 2;
  chains: Chain[];
  tokensByChain: Record<ChainKey, Token[]>;
  selectedChain: ChainKey | null;
  selectedToken: string;
  onChainSelect: (chain: ChainKey, box: 1 | 2) => void;
  onTokenSelect: (tokenName: string, box: 1 | 2) => void;
  isChainDisabled: (chainKey: ChainKey, box: 1 | 2) => boolean;
  defaultChainIcon: any;
  defaultTokenIcon: any;
  isWalletConnected?: boolean;
  walletAddress?: string | null;
  onConnectWallet?: () => void;
  onWalletAddressChange?: (address: string) => void;
  walletInputValue?: string;
  isAnimating?: boolean;
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
  onConnectWallet,
  onWalletAddressChange,
  walletInputValue,
  isAnimating = false,
}: SwapBoxProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const balance = 0; // replace with actual balance from props or context
  const hasInsufficientBalance = Number(inputValue) > balance;

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleChainSelect = (chain: ChainKey) => {
    if (!isChainDisabled(chain, boxNumber)) {
      onChainSelect(chain, boxNumber);
      // Keep dropdown open after selecting network
    }
  };

  const handleTokenSelect = (tokenName: string) => {
    onTokenSelect(tokenName, boxNumber);
    // Close dropdown after selecting token
    setDropdownOpen(false);
  };

  return (
    <div className="border border-white/20 rounded-2xl bg-[#17191a] w-[400px] relative">
      <div className="border-4 border-black/80 rounded-2xl p-5 pb-8 h-full w-full">
        <div className="bg-black rounded-2xl p-1.5 relative grid-pattern">
          <div className="w-full h-full rounded-2xl border border-[#84d46c] relative p-6 text-white">
            <div className="flex justify-end mb-2">Balance: 0.00 </div>

            {/* Network Selection Button */}
            <div className="relative dropdown-container">
              <div
                className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 mb-3 text-white/95 flex gap-2 items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
                onClick={toggleDropdown}
              >
                <div className="flex items-center gap-2">
                  {selectedChain ? (
                    <>
                      <Image
                        src={
                          getCurrentChain(selectedChain)?.icon ||
                          defaultChainIcon
                        }
                        alt={getCurrentChain(selectedChain)?.name || "Network"}
                        className="w-5 h-5"
                      />
                      <span>
                        {getCurrentChain(selectedChain)?.name}
                        <sub className="text-xs text-white/70 ml-1">
                          {selectedToken ? `(${selectedToken})` : "(Token)"}
                        </sub>
                      </span>
                    </>
                  ) : (
                    <span className="text-white/70">Select Network</span>
                  )}
                </div>
                <IoIosArrowDown
                  className={`transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-50 bg-[#1c1f20] border border-[#84d46c]/20 rounded-lg shadow-lg mt-1 p-3">
                  {/* Network Selection */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[#84d46c] mb-2">
                      Select Network
                    </h3>
                    <div className="flex gap-2">
                      {chains.map((chain) => (
                        <div
                          key={chain.key}
                          onClick={() =>
                            handleChainSelect(chain.key as ChainKey)
                          }
                          className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer transition ${
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
                          <span className="text-xs text-white/90">
                            {chain.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Token Selection */}
                  <div>
                    {selectedChain && (
                      <>
                        <h3 className="text-sm font-semibold text-[#84d46c] mb-2">
                          Select Token
                        </h3>
                        <div className="space-y-1">
                          {/* {selectedChain && */}
                          {tokensByChain[selectedChain].map((token) => (
                            <div
                              key={token.name}
                              onClick={() => handleTokenSelect(token.name)}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                                selectedToken === token.name
                                  ? "bg-[#84d46c]/10 border border-[#84d46c]/50"
                                  : "hover:bg-[#84d46c]/10 hover:border hover:border-[#84d46c]/30"
                              }`}
                            >
                              <Image
                                src={token.icon}
                                alt={token.name}
                                className="w-5 h-5"
                              />
                              <span className="text-white/90 text-sm">
                                {token.name}
                              </span>
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
                  } bg-[#17191a] opacity-70 rounded-md p-2 text-white/95 flex items-center justify-between gap-3`}
                >
                  {/* Token Image */}
                  <div className="flex items-center gap-2 w-1/2">
                    {getCurrentToken(selectedChain, selectedToken)?.icon ? (
                      <Image
                        src={
                          getCurrentToken(selectedChain, selectedToken)?.icon
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
                      className="bg-transparent text-white text-lg outline-none w-full"
                    />
                  </div>

                  {/* USD Value */}
                  <div className="text-right">
                    <div className="text-white/50 text-xs">${"0.00"}</div>
                  </div>
                </div>

                {/* Error Message */}
                {hasInsufficientBalance && (
                  <p className="text-red-500 text-sm mt-1 ml-1">
                    Insufficient balance
                  </p>
                )}
              </div>
            ) : (
              <div className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 text-white/95 flex items-center justify-between gap-3">
                {/* Token Image and Static Value */}
                <div className="flex items-center gap-2 w-1/2">
                  {getCurrentToken(selectedChain, selectedToken)?.icon ? (
                    <Image
                      src={getCurrentToken(selectedChain, selectedToken)?.icon}
                      alt={selectedToken || "Token"}
                      className="w-6 h-6"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-600 aspect-square rounded-full" />
                  )}
                  <span className="text-lg text-white">- -</span>
                </div>

                {/* USD Value */}
                <div className="text-right">
                  {/* <div className="text-white/80 text-sm">{selectedToken || 'Token'}</div> */}
                  <div className="text-white/50 text-xs">${"250.00"}</div>
                </div>
              </div>
            )}
          </div>
          <div className="absolute -bottom-8 -left-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
          <div className="absolute -bottom-8 -right-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
          <div className="absolute -top-8 -left-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
          <div className="absolute -top-8 -right-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
        </div>
        {boxNumber === 1 ? (
          <div className="mt-8 flex justify-center">
            {!isWalletConnected ? (
              <ConnectWalletButton />
            ) : (
              <div className="flex flex-col items-center w-full">
                <p className="text-white/70 mb-2">Connected Wallet</p>
                <input
                  className="w-full px-4 py-2 rounded-2xl bg-black text-white border border-[#84d46c]/50"
                  value={walletAddress || ""}
                  readOnly
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center w-full">
            <p className="text-white/70 mb-2">Enter Wallet Address</p>
            <input
              className="w-full px-4 py-2 rounded-2xl bg-black text-white border border-[#84d46c]/50"
              value={walletInputValue || ""}
              onChange={(e) => onWalletAddressChange?.(e.target.value)}
              placeholder="0x..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapBox;
