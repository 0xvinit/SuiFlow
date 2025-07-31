"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import arbitrum from "@/assets/Images/arbone.svg";
import eth from "@/assets/Images/eth.svg";
import sui from "@/assets/Images/sui.png";
import SwapBox from "./SwapBox";
import SwapArrow from "./SwapArrow";
import { chains, tokensByChain } from "@/data/swapData";
import { useSwapState } from "@/hooks/useSwapState";
import ConnectWalletButton from "../ConnectWallet/connectwallet";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import SwappingDetails from "./SwappingDetails";
import Heading from "./Heading";
import { getCurrentToken } from "@/utils/swapUtils";

const SwapPage = () => {
  const { login } = useLogin();
  const { authenticated, user } = usePrivy();

  const [walletInputValue, setWalletInputValue] = useState("");
  const [isArrowAnimating, setIsArrowAnimating] = useState(false);

  const {
    selectedChain1,
    selectedChain2,
    selectedToken1,
    selectedToken2,
    selectChain,
    selectToken,
    isChainDisabled,
  } = useSwapState();

  // Get token icons for animation
  const token1Data = getCurrentToken(selectedChain1, selectedToken1);
  const token2Data = getCurrentToken(selectedChain2, selectedToken2);

  // Trigger animation when both tokens are selected
  useEffect(() => {
    if (
      selectedToken1 &&
      selectedToken2 &&
      token1Data?.icon &&
      token2Data?.icon
    ) {
      setIsArrowAnimating(true);
    } else {
      setIsArrowAnimating(false);
    }
  }, [selectedToken1, selectedToken2, token1Data?.icon, token2Data?.icon]);

  return (
    <>
      <div className="min-h-[calc(100vh-76px)] flex flex-col justify-center">
        <Heading />
        <div className="flex justify-center items-center relative">
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
            isWalletConnected={authenticated}
            walletAddress={user?.wallet?.address || ""}
            onConnectWallet={login}
            isAnimating={isArrowAnimating}
          />

          {/* Swap arrow */}
          <SwapArrow
            selectedToken1={selectedToken1}
            selectedToken2={selectedToken2}
            token1Icon={token1Data?.icon}
            token2Icon={token2Data?.icon}
            isAnimating={isArrowAnimating}
          />

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
            walletInputValue={walletInputValue}
            onWalletAddressChange={setWalletInputValue}
            isAnimating={isArrowAnimating}
          />

          {/* Floating Token Animations - Positioned above everything */}
          {isArrowAnimating && token1Data?.icon && (
            <motion.div
              key="floating-token1"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
              initial={{
                scale: 0,
                opacity: 0,
                x: -250, // Start from left (box 1)
                y: -15,
              }}
              animate={{
                scale: [0, 1.2, 1, 1.2, 0.8],
                opacity: [0, 1, 1, 1, 0],
                x: [-250, -125, 0, 0, 0], // Move to center of arrow
                y: [-35, -35, -35, -38, -38],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                times: [0, 0.25, 0.5, 0.75, 1],
                repeat: Infinity,
                repeatDelay: 1.2,
              }}
            >
              <Image
                src={token1Data.icon}
                alt={selectedToken1}
                width={32}
                height={32}
                className="rounded-full"
              />
            </motion.div>
          )}

          {isArrowAnimating && token2Data?.icon && (
            <motion.div
              key="floating-token2"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
              initial={{
                scale: 0,
                opacity: 0,
                x: 0, // Start from center of arrow
                y: -15,
              }}
              animate={{
                scale: [0, 1.2, 1, 1.2, 0.8],
                opacity: [0, 1, 1, 1, 0],
                x: [0, 125, 250, 260, 265], // Move to right (box 2)
                y: [-35, -35, -35, -35, -38],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                times: [0, 0.25, 0.5, 0.75, 1],
                delay: 0.9, // Start after first token reaches arrow
                repeat: Infinity,
                repeatDelay: 1.2,
              }}
            >
              <Image
                src={token2Data.icon}
                alt={selectedToken2}
                width={32}
                height={32}
                className="rounded-full"
              />
            </motion.div>
          )}
        </div>
        <div className="mt-16">
          <SwappingDetails />
        </div>
      </div>
    </>
  );
};

export default SwapPage;
