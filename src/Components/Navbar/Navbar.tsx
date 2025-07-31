'use client';

import React from 'react';
import Image from 'next/image';
// import logo from '@/assets/logo.png'; // adjust path if your logo is elsewhere
import ConnectWalletButton from '../ConnectWallet/connectwallet';

const Navbar = () => {
  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between shadow-md">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        {/* <Image src={logo} alt="Logo" width={40} height={40} /> */}
        <span className="font-bold text-lg">SuiFlow</span>
      </div>

      {/* Connect Wallet Button */}
      <ConnectWalletButton />
    </nav>
  );
};

export default Navbar;
