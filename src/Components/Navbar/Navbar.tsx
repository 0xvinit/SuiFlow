"use client";

import React from "react";
import { MultiChainConnect } from "@/Components/ConnectWallet/MultiChainConnect";

const Navbar = () => {
  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between shadow-md">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        {/* <Image src={logo} alt="Logo" width={40} height={40} /> */}
        <span className="font-extrabold text-[#84d46c] text-[50px] font-pixelify tracking-wider">
          Suiflow
        </span>
      </div>

      {/* Connect Wallet and Chain Selector */}
      <MultiChainConnect />
    </nav>
  );
};

export default Navbar;
