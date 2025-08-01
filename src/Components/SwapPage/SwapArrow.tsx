"use client";
import { motion, AnimatePresence } from "framer-motion";
import { IoIosArrowRoundForward } from "react-icons/io";
import { StaticImageData } from "next/image";

interface SwapArrowProps {
  selectedToken1?: string;
  selectedToken2?: string;
  token1Icon?: string | StaticImageData;
  token2Icon?: string | StaticImageData;
  isAnimating?: boolean;
}

const SwapArrow = ({ isAnimating = false }: SwapArrowProps) => {
  return (
    <div className="bg-black border border-white/20 rounded-full mx-8 relative w-16 h-16 flex flex-col items-center justify-center -translate-y-10">
      <IoIosArrowRoundForward className="size-12 text-white" />

      {/* Glow effect during animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            key="arrow-glow"
            className="absolute inset-0 rounded-full bg-[#84d46c]/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.2, 1, 1.2, 0.8],
              opacity: [0, 0.5, 0.3, 0.5, 0],
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: 2.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwapArrow;
