"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState, useRef } from "react";
import { FaChevronDown, FaCopy, FaCheck } from "react-icons/fa";

export default function ConnectWalletButton() {
  const { login, logout, authenticated, user } = usePrivy();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedChain, setSelectedChain] = useState("Arbitrum");
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    if (user?.wallet?.address) {
      navigator.clipboard.writeText(user.wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogin = () => login();
  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const handleMouseEnter = () => {
    clearTimeout(closeTimeoutRef.current!);
    openTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(true);
    }, 300); // Open after 300ms
  };
  
  const handleMouseLeave = () => {
    clearTimeout(openTimeoutRef.current!);
    closeTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 300); // Close after 300ms
  };
  
  return (
    <div className="relative inline-block text-left neuebit">
      {!authenticated ? (
        <button
          onClick={handleLogin}
          className="px-8 py-2 rounded-full text-black font-semibold bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase w-fit text-[24px]"
        >
          Connect Wallet
        </button>
      ) : (
        <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
          className="group relative"
        >
          <button className="flex items-center gap-2 px-6 py-1 rounded-full text-black font-semibold bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition duration-300 uppercase w-fit hover:scale-105 text-[24px]">
            {selectedChain}
            <FaChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-2 right-0 z-50 bg-[#17191a] border border-[#84d46c]/40 shadow-2xl shadow-black/50 rounded-xl p-4 w-64 space-y-4 backdrop-blur-sm">
              {/* Wallet Address + Copy */}
              <div className="flex items-center justify-between neuebit text-[22px] bg-[#323332]/50 p-3 rounded-lg text-white font-mono border border-gray-700">
                <span className="truncate w-[80%]">
                  {user?.wallet?.address?.slice(0, 6)}...
                  {user?.wallet?.address?.slice(-4)}
                </span>
                <button
                  onClick={handleCopy}
                  title="Copy address"
                  className="text-[#84d46c] hover:text-[#84d46c]/80 transition-colors"
                >
                  {copied ? <FaCheck size={14} /> : <FaCopy size={14} />}
                </button>
              </div>

              {/* Divider */}
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#84d46c]/50 to-transparent"></div>

              {/* Chain Selector */}
              <div className="space-y-3">
                <p className="text-[20px] font-semibold text-white leading-6">
                  Select Chain
                </p>
                <div className="flex gap-2">
                  {["Arbitrum", "Sui"].map((chain) => (
                    <button
                      key={chain}
                      onClick={() => setSelectedChain(chain)}
                      className={`px-4 py-1.5 text-[18px] font-semibold rounded-full border-2 transition-all duration-300 cursor-pointer ${
                        selectedChain === chain
                          ? "bg-gradient-to-br from-[#84d46c] to-[#84d46c]/60 text-black shadow-lg shadow-[#84d46c]/30 border-[#84d46c]"
                          : "bg-[#323332]/50 border-[#84d46c]/40 text-white hover:bg-[#323332]/20 hover:border-[#84d46c]/60"
                      }`}
                    >
                      {chain}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#84d46c]/50 to-transparent"></div>

              {/* Disconnect */}
              <button
                onClick={handleLogout}
                className="w-full text-red-400 font-semibold py-2.5 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 text-[22px] border border-red-500/30 hover:border-red-400/50"
              >
                Disconnect
              </button>
            </div>
          )} 
        </div>
      )}
    </div>
  );
}
