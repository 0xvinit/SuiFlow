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
import ConnectWalletButton from "../ConnectWallet/connectwallet";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import SwappingDetails from "./SwappingDetails";
import Heading from "./Heading";


const SwapPage = () => {
  const { login } = useLogin();
  const { authenticated, user } = usePrivy();
  
  const [walletInputValue, setWalletInputValue] = useState("");

  const {
    selectedChain1,
    selectedChain2,
    selectedToken1,
    selectedToken2,
    selectChain,
    selectToken,
    isChainDisabled,
  } = useSwapState();



  return (
    <>
    <div className="min-h-[calc(100vh-76px)] flex flex-col justify-center">
      <Heading/>
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
          isWalletConnected={authenticated}
          walletAddress={user?.wallet?.address || ""}
          onConnectWallet={login}
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
          walletInputValue={walletInputValue}
  onWalletAddressChange={setWalletInputValue}
        />
      </div>
      <div className="mt-16">
        <SwappingDetails/>
      </div>
    </div>
    </>
  );
};

export default SwapPage;
