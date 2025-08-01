import React from "react";
import Image from "next/image";
import { tokensByChain } from "@/data/swapData";

const Footer = () => {
  // Get all unique tokens from all chains
  const allTokens = Object.values(tokensByChain).flat();
  const uniqueTokens = allTokens.filter(
    (token, index, self) =>
      index === self.findIndex((t) => t.name === token.name)
  );

  return (
    <footer className="relative w-full h-64 ">
      {/* Grid Background */}
      <div className="absolute inset-0 ">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(132, 212, 108, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(132, 212, 108, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            transform: "perspective(1000px) rotateX(60deg)",
            transformOrigin: "center bottom",
          }}
        />

        {/* Wavy Lines Pattern */}
        <div className="absolute inset-0">
          <svg
            className="w-full h-full opacity-0"
            viewBox="0 0 1200 400"
            preserveAspectRatio="none"
          >
            <path
              d="M0,200 Q300,150 600,200 T1200,200 L1200,400 L0,400 Z"
              fill="url(#gradient1)"
            />
            <path
              d="M0,250 Q400,200 800,250 T1200,250 L1200,400 L0,400 Z"
              fill="url(#gradient2)"
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#fff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Fixed Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#84d46c]/10 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8">
        {/* Token Section */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-white text-2xl font-bold mb-6 tracking-wider">
              Supported Tokens
            </h3>
            <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
              {uniqueTokens.map((token, index) => (
                <div
                  key={token.name}
                  className="flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-[#84d46c]/30 rounded-lg px-4 py-3 hover:border-[#84d46c]/60 transition-all duration-300 group"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="relative">
                    <Image
                      src={token.icon}
                      alt={token.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <div className="absolute inset-0 bg-[#84d46c]/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-white font-semibold text-lg tracking-wide">
                    {token.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex justify-between items-center text-white/70 text-sm">
          <div className="flex items-center gap-6">
            <span className="font-semibold">transferto.xyz © 2024</span>
            <a href="#" className="hover:text-[#84d46c] transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-[#84d46c] transition-colors">
              Terms & Conditions
            </a>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#84d46c] transition-colors">
              Medium
            </a>
            <a href="#" className="hover:text-[#84d46c] transition-colors">
              Github
            </a>
            <a href="#" className="hover:text-[#84d46c] transition-colors">
              Discord
            </a>
          </div>
        </div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#84d46c] rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </footer>
  );
};

export default Footer;
