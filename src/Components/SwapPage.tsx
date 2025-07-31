"use client";
import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import arbitrum from "@/assets/Images/arbone.svg";
import eth from "@/assets/Images/eth.svg";
import sui from "@/assets/Images/sui.png";
import SwapBox from "./SwapBox";
import SwapArrow from "./SwapArrow";
import { chains, tokensByChain } from "@/data/swapData";
import { useSwapState } from "@/hooks/useSwapState";

const SwapPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupDirection, setPopupDirection] = useState<"left" | "right">(
    "left"
  );

  const {
    selectedChain1,
    selectedChain2,
    selectedToken1,
    selectedToken2,
    selectChain,
    selectToken,
    isChainDisabled,
  } = useSwapState();

  useEffect(() => {
    if (isOpen && popupRef.current) {
      gsap.fromTo(
        popupRef.current,
        { x: popupDirection === "left" ? "-100%" : "100%", opacity: 0 },
        { x: "0%", opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [isOpen, popupDirection]);

  const closePopup = () => {
    if (popupRef.current) {
      gsap.to(popupRef.current, {
        x: popupDirection === "left" ? "-100%" : "100%",
        opacity: 0,
        duration: 0.4,
        ease: "power3.in",
        onComplete: () => setIsOpen(false),
      });
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        closePopup();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, popupDirection]);

  return (
    <div className="min-h-screen flex flex-col justify-center">
    <div className="flex justify-center items-center">
      {/* Swap box 1 */}
      <SwapBox
        boxNumber={1}
        chains={chains}
        tokensByChain={tokensByChain}
        selectedChain={selectedChain1}
        selectedToken={selectedToken1}
        onChainSelect={selectChain}
        onTokenSelect={selectToken}
        isChainDisabled={isChainDisabled}
        defaultChainIcon={arbitrum}
        defaultTokenIcon={eth}
      />

      {/* Swap arrow */}
      <SwapArrow />

      {/* Swap box 2 */}
      <SwapBox
        boxNumber={2}
        chains={chains}
        tokensByChain={tokensByChain}
        selectedChain={selectedChain2}
        selectedToken={selectedToken2}
        onChainSelect={selectChain}
        onTokenSelect={selectToken}
        isChainDisabled={isChainDisabled}
        defaultChainIcon={sui}
        defaultTokenIcon={sui}
      />
    </div>
    <div className="mt-8 flex justify-center">
          <button className="px-8 py-2.5 rounded-full text-black font-semibold bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase">
            Connect Wallet
          </button>
        </div>
    </div>
  );
};

export default SwapPage;
