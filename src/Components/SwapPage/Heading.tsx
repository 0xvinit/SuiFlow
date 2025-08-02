// Heading.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  easeOut,
  easeIn,
} from "framer-motion";
import Image from "next/image";
import gsap from "gsap";
import useTokenPrices from "@/hooks/useTokenPrice";

const Heading = () => {
  const tokens = useTokenPrices();
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const duration = 5000;
    const visibleTime = 3000;
    const showTimeout = setTimeout(() => setShow(false), visibleTime);
    const nextTimeout = setTimeout(() => {
      setIndex((prev) => (prev + 1) % tokens.length);
      setShow(true);
    }, duration);
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(nextTimeout);
    };
  }, [index, tokens.length]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltipRef.current) {
      gsap.to(tooltipRef.current, {
        left: e.clientX + 10,
        top: e.clientY + 10,
        duration: 0.15,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const currentToken = tokens[index];

  const containerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const letterVariants = {
    initial: { y: "100%", opacity: 0, scale: 0.8 },
    animate: {
      y: "0%",
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: easeOut },
    },
    exit: {
      y: "-100%",
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.6, ease: easeIn },
    },
  };
  const imageVariants = {
    initial: { scale: 0, opacity: 0, rotate: -180 },
    animate: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { duration: 0.7, ease: easeOut },
    },
    exit: {
      scale: 0,
      opacity: 0,
      rotate: 180,
      transition: { duration: 0.5, ease: easeIn },
    },
  };

  return (
    <div
      className={`mx-auto text-center font-bold relative w-full mb-4 xl:mb-6`}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onMouseMove={handleMouseMove}
    >
      <h1 className={`text-[60px] lg:text-[70px] xl:text-[80px] leading-[70px] lg:leading-[80px] xl:leading-[100px] tracking-wider uppercase font-vt323`}>
        Cross Chain Swap
      </h1>

      <div className="text-[40px] lg:text-[50px] xl:text-[60px] relative h-20 xl:h-24 2xl:h-28 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {show && (
            <motion.div
              key={currentToken.name}
              className="flex items-center space-x-4 font-vt323 tracking-wider"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.div variants={imageVariants} className="flex-shrink-0">
                <Image
                  src={currentToken.icon}
                  alt={currentToken.name}
                  width={40}
                  height={40}
                  className="rounded-full translate-y-1"
                />
              </motion.div>

              <div
                className="flex space-x-0"
                style={{ color: currentToken.color }}
              >
                {currentToken.name.split("").map((letter, i) => (
                  <motion.span key={i} variants={letterVariants}>
                    {letter}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`pointer-events-none fixed z-50 px-5 py-2 rounded-xl shadow-lg backdrop-blur-sm border bg-white/90 text-black text-sm transition-opacity duration-300 ${
          tooltipVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ transform: "translate(-50%, -100%)", marginTop: "-10px" }}
      >
        <div className="flex items-center gap-3">
          <Image
            src={currentToken.icon}
            alt={currentToken.name}
            width={24}
            height={24}
            className="rounded-full"
          />
          <div>
            <div className="font-semibold text-xl leading-4 mb-1">
              {currentToken.name}
            </div>
            <div className="text-base leading-4">{currentToken.price}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heading;
