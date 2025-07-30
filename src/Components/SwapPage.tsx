"use client";
import { useState, useRef, useEffect } from "react";
import optimism from "@/assets/Images/optimism.svg";
import Image from "next/image";
import { IoIosArrowDown } from "react-icons/io";
import { AiOutlineSwap } from "react-icons/ai";
import { gsap } from "gsap";
import { IoArrowBackOutline, IoArrowForward } from "react-icons/io5";

type ChainKey = keyof typeof tokensByChain;

const chains = [
  { name: "Arbitrum Sepolia", key: "arbitrum", icon: "/icons/arbitrum.svg" },
  { name: "Sui", key: "sui", icon: "/icons/sui.svg" },
];

const tokensByChain = {
  arbitrum: [
    { name: "ETH", icon: "/icons/eth.svg" },
    { name: "USDT", icon: "/icons/usdt.svg" },
    { name: "USDC", icon: "/icons/usdc.svg" },
    { name: "ARB", icon: "/icons/arb.svg" },
  ],
  sui: [
    { name: "USDT", icon: "/icons/usdt.svg" },
    { name: "USDC", icon: "/icons/usdc.svg" },
    { name: "SUI", icon: "/icons/sui.svg" },
  ],
};
const SwapPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupDirection, setPopupDirection] = useState<"left" | "right">(
    "left"
  );
  // const [selectedChain, setSelectedChain] = useState("arbitrum");
  const [selectedChain, setSelectedChain] = useState<ChainKey>("arbitrum");

  const togglePopup = (direction: "left" | "right") => {
    setPopupDirection(direction);
    setIsOpen(true);
  };

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
    <div className="flex min-h-screen justify-center items-center">
      {/* Swap box 1 */}
      <div className="border border-white/20 rounded-2xl bg-[#17191a] w-[400px]  relative">
        <div className="border-4 border-black/80 rounded-2xl p-5 pb-8 h-full w-full">
          <div className="bg-black rounded-2xl p-1.5 relative overflow-hidden grid-pattern">
            <div className="w-full h-full rounded-2xl  border border-[#84d46c] relative z-10 p-6 text-white">
              <div className="flex justify-end mb-2">Balance: 0.00 </div>
              <div
                className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 mb-3 text-white/95 flex gap-2 items-center justify-between"
                onClick={() => togglePopup("left")}
              >
                <span>
                  Arbitrum
                  <sub className="text-xs text-white/70 ml-1">{"(Token)"}</sub>
                </span>
                <IoIosArrowDown />
              </div>

              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                <div className="relative bg-black border border-white/10 rounded-full size-12 flex items-center justify-center z-10">
                  <Image src={optimism} alt="Main" className="size-7 z-10" />
                  <Image
                    src={optimism}
                    alt="Badge"
                    className="border-2 border-[#17191a] absolute right-1 bottom-1 rounded-full size-4 z-20"
                  />
                </div>
              </div>

              <div className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 text-white/95 flex gap-2 items-center ">
                0xbb4c2bab6b2de45f9c...
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -bottom-8 -right-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -top-8 -left-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -top-8 -right-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            {/* Glow on bottom-left corner */}
          </div>
          <div className="mt-8 flex justify-center">
            <button className="px-8 py-2.5 rounded-full text-black font-semibold bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>

      {/* swap arrow */}
      <div className="bg-black border border-white/20 rounded-full p-8 mx-8 relative w-36 h-36 flex flex-col items-center justify-center">
        <AiOutlineSwap className="size-20 text-white" />
      </div>

      {/* swap box 2 */}
      <div className="border border-white/20 rounded-2xl bg-[#17191a] w-[400px]  relative">
        <div className="border-4 border-black/80 rounded-2xl p-5 pb-8 h-full w-full">
          <div className="bg-black rounded-2xl p-1.5 relative overflow-hidden grid-pattern">
            <div className="w-full h-full rounded-2xl  border border-[#84d46c] relative z-10 p-6 text-white">
              <div className="flex justify-end mb-2">Balance: 0.00 </div>
              <div
                className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 mb-3 text-white/95 flex gap-2 items-center justify-between"
                onClick={() => togglePopup("right")}
              >
                <span>
                  Arbitrum
                  <sub className="text-xs text-white/70 ml-1">{"(Token)"}</sub>
                </span>
                <IoIosArrowDown />
              </div>

              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                <div className="relative bg-black border border-white/10 rounded-full size-12 flex items-center justify-center z-10">
                  <Image src={optimism} alt="Main" className="size-7 z-10" />
                  <Image
                    src={optimism}
                    alt="Badge"
                    className="border-2 border-[#17191a] absolute right-1 bottom-1 rounded-full size-4 z-20"
                  />
                </div>
              </div>

              <div className="border border-white/20 bg-[#17191a] opacity-70 rounded-md p-2 text-white/95 flex gap-2 items-center ">
                0xbb4c2bab6b2de45f9c...
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -bottom-8 -right-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -top-8 -left-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            <div className="absolute -top-8 -right-8 w-[100px] h-[100px] bg-[#84d46c] blur-2xl opacity-30 rounded-full z-0" />
            {/* Glow on bottom-left corner */}
          </div>
          <div className="mt-8 flex justify-center">
            <button className="px-8 py-2.5 rounded-full text-black font-semibold bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div
            ref={popupRef}
            className={`bg-[#1c1f20] bg-opacity-95 border border-[#84d46c]/20 shadow-[0_0_40px_#84d46c40]  w-full max-w-[1000px] h-[60vh] flex gap-6 overflow-hidden fixed transition-all duration-300`}
          >
            {/* Close Button */}
            <button
              onClick={closePopup}
              className="absolute top-4 left-4 text-white hover:text-[#84d46c] transition text-2xl font-bold z-10"
            >
              ×
            </button>

            {/* Chains List */}
            <div className="w-1/3 border-r border-[#84d46c]/20 pr-4 text-white overflow-y-auto">
              <h2 className="text-lg font-semibold text-[#84d46c] mb-4">
                Select Chain
              </h2>
              {chains.map((chain) => (
                <div
                  key={chain.key}
                  onClick={() => setSelectedChain(chain.key as ChainKey)}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    selectedChain === chain.key
                      ? "border-[#84d46c]/50 bg-[#84d46c]/10"
                      : "border-transparent"
                  } hover:border-[#84d46c]/50 hover:bg-[#84d46c]/10 transition mb-2 cursor-pointer`}
                >
                  <img src={chain.icon} alt={chain.name} className="w-6 h-6" />
                  <span className="text-white/90">{chain.name}</span>
                </div>
              ))}
            </div>

            {/* Token List */}
            <div className="w-1/2 px-4 text-white overflow-y-auto">
              <h2 className="text-lg font-semibold text-[#84d46c] mb-4">
                Select Token
              </h2>
              {tokensByChain[selectedChain].map(
                (token: { name: string; icon: string }, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[#84d46c]/50 hover:bg-[#84d46c]/10 transition mb-2 cursor-pointer"
                  >
                    <img
                      src={token.icon}
                      alt={token.name}
                      className="w-6 h-6"
                    />
                    <span className="text-white/90">{token.name}</span>
                  </div>
                )
              )}
            </div>

            {/* Arrow Icon */}
            <div className="w-fit pl-4 text-white">
              {" "}
              {/* <- text-white added */}
              <div className="py-4 px-12 bg-black/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="120"
                  height="120"
                  className="text-white"
                >
                  <path
                    d="M4 11v2h12v2h2v-2h2v-2h-2V9h-2v2H4zm10-4h2v2h-2V7zm0 0h-2V5h2v2zm0 10h2v-2h-2v2zm0 0h-2v2h2v-2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="py-4 px-12 bg-black/25">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="120"
                  height="120"
                  className="text-white"
                >
                  <path
                    d="M20 11v2H8v2H6v-2H4v-2h2V9h2v2h12zM10 7H8v2h2V7zm0 0h2V5h-2v2zm0 10H8v-2h2v2zm0 0h2v2h-2v-2z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>

            {/* Bottom Green Glow (Optional) */}
            <div className="absolute -bottom-10 -left-10 w-[100px] h-[100px] bg-[#84d46c] blur-3xl opacity-20 rounded-full z-0" />
            <div className="absolute -bottom-10 -right-10 w-[100px] h-[100px] bg-[#84d46c] blur-3xl opacity-20 rounded-full z-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapPage;
