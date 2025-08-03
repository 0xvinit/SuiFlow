"use client";
import React, { useState, useEffect, useRef } from "react";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { SuiWalletSelector } from "./SuiWalletSelector";
import Image from "next/image";
import EVM from "@/assets/Images/evmNetwork.png"
import SUI from "@/assets/Images/suiNetwork.png"
interface MultiChainConnectProps {
  className?: string;
}

export const MultiChainConnect: React.FC<MultiChainConnectProps> = ({
  className,
}) => {
  const { 
    evmWallet, 
    suiWallet, 
    isAnyWalletConnected, 
    isWrongChain, 
    currentChainId, 
    switchToNetwork,
    SUPPORTED_NETWORKS,
    SUI_NETWORKS,
    selectedEvmNetwork,
    selectedSuiNetwork,
    setSelectedEvmNetwork,
    setSelectedSuiNetwork
  } = useMultiChainWallet();
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [showSuiWalletSelector, setShowSuiWalletSelector] = useState(false);

  const [showEvmDropdown, setShowEvmDropdown] = useState(false);
  const [showSuiDropdown, setShowSuiDropdown] = useState(false);
  const evmDropdownRef = useRef(null);
  const suiDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        evmDropdownRef.current &&
        !(evmDropdownRef.current as HTMLDivElement).contains(event.target as Node)
      ) {
        setShowEvmDropdown(false);
      }
      if (
        suiDropdownRef.current &&
        !(suiDropdownRef.current as HTMLDivElement).contains(event.target as Node)
      ) {
        setShowSuiDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = (chain: "evm" | "sui") => {
    if (chain === "evm") {
      evmWallet.connect();
    } else if (chain === "sui") {
      setShowSuiWalletSelector(true);
    }
    setShowChainSelector(false);
  };

  const handleDisconnect = (chain: "evm" | "sui") => {
    if (chain === "evm") {
      evmWallet.disconnect();
    } else if (chain === "sui") {
      suiWallet.disconnect();
    }
  };

  const handleSwitchChain = (fromChain: "evm" | "sui", toChain: "evm" | "sui") => {
    // Disconnect current wallet
    handleDisconnect(fromChain);
    
    // Connect to new chain
    setTimeout(() => {
      if (toChain === "evm") {
        evmWallet.connect();
      } else if (toChain === "sui") {
        setShowSuiWalletSelector(true);
      }
    }, 100);
    
    // Close dropdowns
    setShowEvmDropdown(false);
    setShowSuiDropdown(false);
  };

  const handleSuiWalletSelect = (walletName: string) => {
    console.log("Selected Sui wallet:", walletName);
    setShowSuiWalletSelector(false);
    // alert(
    //   `Successfully connected to ${walletName}! Check the debug panel to see the connection status.`
    // );
  };


  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showChainSelector || showSuiWalletSelector) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showChainSelector, showSuiWalletSelector]);

  return (
    <React.Fragment key="multichain-connect">
    <div className={`relative ${className}`}>
      {!isAnyWalletConnected ? (
        <button
          onClick={() => setShowChainSelector(!showChainSelector)}
          className="px-8 py-2 rounded-full text-black font-medium bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase w-fit text-[24px]"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center space-x-3">
          {evmWallet.connected && (
            <div className="relative inline-block" ref={evmDropdownRef}>
              {isWrongChain ? (
                <div 
                  onClick={() => setShowEvmDropdown(!showEvmDropdown)}
                  className="px-6 py-1.5 rounded-full text-white bg-gradient-to-br from-[#ff4444] to-[#cc0000] shadow-inner shadow-red-500/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 uppercase w-fit text-[20px] border-2 border-red-400"
                >
                  <div className="flex items-center justify-between">
                    <span>⚠️ Wrong Chain</span>
                    <svg 
                      className={`w-4 h-4 ml-2 transition-transform duration-200 ${showEvmDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setShowEvmDropdown(!showEvmDropdown)}
                  className="px-6 py-1.5 rounded-full text-black bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase w-fit text-[20px]"
                >
                  <div className="flex items-center justify-between">
                    <span>{SUPPORTED_NETWORKS[selectedEvmNetwork].name}: {evmWallet.address?.slice(0, 6)}...{evmWallet.address?.slice(-4)}</span>
                    <svg 
                      className={`w-4 h-4 ml-2 transition-transform duration-200 ${showEvmDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
              
              {showEvmDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-[#17191a] border border-[#84d46c]/30 rounded-lg shadow-xl z-50 min-w-[250px] overflow-hidden">
                  {isWrongChain && (
                    <React.Fragment key="wrong-chain-section">
                      <div className="px-4 py-3 text-red-400 font-vt323 text-sm tracking-wider border-b border-[#84d46c]/20 bg-red-900/20">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 13.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span>Wrong Network Detected</span>
                        </div>
                        <div className="text-xs mt-1 text-gray-400">
                          Current: Chain ID {currentChainId} | Required: {SUPPORTED_NETWORKS[selectedEvmNetwork].name} ({SUPPORTED_NETWORKS[selectedEvmNetwork].chainId})
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          switchToNetwork(selectedEvmNetwork);
                          setShowEvmDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-[#84d46c]/10 hover:text-[#84d46c] transition-colors font-vt323 text-lg tracking-wider flex items-center space-x-2 border-b border-[#84d46c]/20"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l-4-4" />
                        </svg>
                        <span>Switch to {SUPPORTED_NETWORKS[selectedEvmNetwork].name}</span>
                      </button>
                    </React.Fragment>
                  )}
                  
                  {/* Network Selector */}
                  <div className="px-4 py-2 border-b border-[#84d46c]/20">
                    <div className="text-[#84d46c] font-vt323 text-sm tracking-wider mb-2">Select Network:</div>
                    <div className="space-y-1">
                      {Object.entries(SUPPORTED_NETWORKS).map(([key, network]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedEvmNetwork(key as keyof typeof SUPPORTED_NETWORKS);
                            if (evmWallet.connected) {
                              switchToNetwork(key as keyof typeof SUPPORTED_NETWORKS);
                            }
                            setShowEvmDropdown(false);
                          }}
                          className={`w-full px-2 py-1 text-left rounded transition-colors font-vt323 text-sm flex items-center justify-between ${
                            selectedEvmNetwork === key 
                              ? 'bg-[#84d46c]/20 text-[#84d46c]' 
                              : 'text-white hover:bg-[#84d46c]/10 hover:text-[#84d46c]'
                          }`}
                        >
                          <span>{network.name}</span>
                          {selectedEvmNetwork === key && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {!isWrongChain && (
                    <button
                      onClick={() => handleSwitchChain("evm", "sui")}
                      className="w-full px-4 py-3 text-left text-white hover:bg-[#84d46c]/10 hover:text-[#84d46c] transition-colors font-vt323 text-lg tracking-wider flex items-center space-x-2 border-b border-[#84d46c]/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l-4-4" />
                      </svg>
                      <span>Switch to Sui</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDisconnect("evm");
                      setShowEvmDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-[#84d46c]/10 hover:text-[#84d46c] transition-colors font-vt323 text-lg tracking-wider flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          )}
          {suiWallet.connected && (
            <div className="relative inline-block" ref={suiDropdownRef}>
              <div 
                onClick={() => setShowSuiDropdown(!showSuiDropdown)}
                className="px-6 py-1.5 rounded-full text-black bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase w-fit text-[20px]"
              >
                <div className="flex items-center justify-between">
                  <span>Sui {selectedSuiNetwork}: {suiWallet.address?.slice(0, 6)}...{suiWallet.address?.slice(-4)}</span>
                  <svg 
                    className={`w-4 h-4 ml-2 transition-transform duration-200 ${showSuiDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {showSuiDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-[#17191a] border border-[#84d46c]/30 rounded-lg shadow-xl z-50 min-w-[220px] overflow-hidden">
                  {/* Network Selector */}
                  <div className="px-4 py-2 border-b border-[#84d46c]/20">
                    <div className="text-[#84d46c] font-vt323 text-sm tracking-wider mb-2">Select Network:</div>
                    <div className="space-y-1">
                      {Object.entries(SUI_NETWORKS).map(([key]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedSuiNetwork(key as keyof typeof SUI_NETWORKS);
                            setShowSuiDropdown(false);
                          }}
                          className={`w-full px-2 py-1 text-left rounded transition-colors font-vt323 text-sm flex items-center justify-between ${
                            selectedSuiNetwork === key 
                              ? 'bg-[#84d46c]/20 text-[#84d46c]' 
                              : 'text-white hover:bg-[#84d46c]/10 hover:text-[#84d46c]'
                          }`}
                        >
                          <span>Sui {key.charAt(0) + key.slice(1).toLowerCase()}</span>
                          {selectedSuiNetwork === key && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleSwitchChain("sui", "evm")}
                    className="w-full px-4 py-3 text-left text-white hover:bg-[#84d46c]/10 hover:text-[#84d46c] transition-colors font-vt323 text-lg tracking-wider flex items-center space-x-2 border-b border-[#84d46c]/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l-4-4" />
                    </svg>
                    <span>Switch to EVM</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDisconnect("sui");
                      setShowSuiDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-[#84d46c]/10 hover:text-[#84d46c] transition-colors font-vt323 text-lg tracking-wider flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      

      {/* Sui Wallet Selector Modal */}
      {showSuiWalletSelector && (
        <SuiWalletSelector
          onWalletSelect={handleSuiWalletSelect}
          onClose={() => setShowSuiWalletSelector(false)}
        />
      )}
    </div>

    {/* Chain Selector Modal */}
    {showChainSelector && !isAnyWalletConnected && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/80 h-screen">
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#17191a] border border-[#84d46c]/20 rounded-2xl p-8 max-w-md w-full shadow-2xl">

            <div className="text-center mb-6">
              <h3 className="text-3xl font-vt323 text-white tracking-wider mb-2">
                Choose Network
              </h3>
              <p className="text-gray-400 font-vt323 text-lg"> 
                Select your preferred blockchain network
              </p>
            </div>

            <div className="space-y-4">
              {/* EVM Option */}
              <button
                onClick={() => handleConnect("evm")}
                className="w-full p-4 bg-[#1c1f20] hover:bg-[#84d46c]/10 rounded-xl cursor-pointer border border-[#84d46c]/30 hover:border-[#84d46c]/50 transition-all duration-300 transform hover:scale-105 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    {/* <span className="text-black font-bold text-lg">E</span> */}
                    <Image src={EVM} alt="" className=""/>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-vt323 text-[24px] tracking-wider">
                      EVM Networks
                    </div>
                    <div className="text-gray-400 font-vt323 text-lg">
                      Ethereum, Polygon, BSC & more
                    </div>
                  </div>
                </div>
              </button>

              {/* Sui Option */}
              <button
                onClick={() => handleConnect("sui")}
                className="w-full p-4 bg-[#1c1f20] hover:bg-[#84d46c]/10 rounded-xl cursor-pointer border border-[#84d46c]/30 hover:border-[#84d46c]/50 transition-all duration-300 transform hover:scale-105 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    {/* <span className="text-black font-bold text-lg">S</span> */}
                    <Image src={SUI} alt="" className=""/>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-vt323 text-[24px] tracking-wider">
                      Sui Network
                    </div>
                    <div className="text-gray-400 font-vt323 text-lg">
                      Fast & scalable blockchain
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowChainSelector(false)}
              className="mt-6 w-full py-3 bg-[#1c1f20] hover:bg-[#84d46c]/10 cursor-pointer text-white rounded-xl font-vt323 text-[24px] tracking-wider transition-colors border border-[#84d46c]/30"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};
