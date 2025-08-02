"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import arbitrum from "@/assets/Images/arbone.svg";
import eth from "@/assets/Images/eth.svg";
import sui from "@/assets/Images/sui.png";
import SwapBox from "./SwapBox";
import SwapArrow from "./SwapArrow";
import { chains, tokensByChain } from "@/data/swapData";
import { useSwapState } from "@/hooks/useSwapState";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import SwappingDetails from "./SwappingDetails";
import Heading from "./Heading";
import { getCurrentToken } from "@/utils/swapUtils";
import { useTokenToTokenConversion } from "@/hooks/useTokenToTokenConversion";
import { useMultiChainWallet } from "@/hooks/useMultiChainWallet";
import { MultiChainConnect } from "../ConnectWallet/MultiChainConnect";

const SwapPage = () => {
  const { login } = useLogin();
  const { authenticated, user } = usePrivy();
  const { evmWallet, suiWallet, isAnyWalletConnected, isWrongChain } = useMultiChainWallet();

  const [walletInputValue, setWalletInputValue] = useState("");
  const [isArrowAnimating, setIsArrowAnimating] = useState(false);

  const {
    selectedChain1,
    selectedChain2,
    selectedToken1,
    selectedToken2,
    inputValue1,
    selectChain,
    selectToken,
    setInputValue,
    isChainDisabled,
  } = useSwapState();

  // Get token icons for animation
  const token1Data = getCurrentToken(selectedChain1, selectedToken1);
  const token2Data = getCurrentToken(selectedChain2, selectedToken2);

  const { convertedValue, isLoading } = useTokenToTokenConversion(
    selectedToken1,
    selectedToken2,
    inputValue1 || "0"
  );

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
            isAnimating={isArrowAnimating}
            inputValue={inputValue1}
            onInputChange={(value: string) => setInputValue(value, 1)}
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
            convertedValue={convertedValue}
            // isLoading={isLoading}
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
                y: -30,
              }}
              animate={{
                scale: [0, 1.2, 1, 1.2, 0.8],
                opacity: [0, 1, 1, 1, 0],
                x: [-250, 0], // Smooth move to center of arrow
                y: [-30, -35], // Smooth vertical movement
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 1.8,
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
                y: -30,
              }}
              animate={{
                scale: [0, 1.2, 1, 1.2, 0.8],
                opacity: [0, 1, 1, 1, 0],
                x: [0, 250], // Smooth move to right (box 2)
                y: [-30, -35], // Smooth vertical movement
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 1.8,
                ease: "easeInOut",
                delay: 1.8, // Start after first token reaches arrow
                repeat: Infinity,
                repeatDelay: 1.8,
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
        <div className="mt-16 mb-28">
          <SwappingDetails />
        </div>
      </div>
    </>
  );
};

export default SwapPage;
