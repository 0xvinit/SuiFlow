'use client';

import React from 'react';
import ConnectWallet from '@/Components/ConnectWallet/connectwallet';

const Navbar = () => {
  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between shadow-md">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        {/* <Image src={logo} alt="Logo" width={40} height={40} /> */}
        <span className="font-extrabold text-[#84d46c] text-[50px] font-pixelify tracking-wider">Suiflow</span>
      </div>

      {/* Connect Wallet Button */}
      <ConnectWallet />
    </nav>
  );
};

export default Navbar;
