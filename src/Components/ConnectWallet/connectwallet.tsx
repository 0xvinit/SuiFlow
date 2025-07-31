'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function ConnectWalletButton() {
  const { login, authenticated, user } = usePrivy();

  const handleClick = () => {
    login();
  };

  if (authenticated && user?.wallet?.address) {
    console.log("Connected wallet address:", user.wallet.address);
  }

  return (
    <button
      onClick={handleClick}
      className="px-8 py-2.5 rounded-full text-black font-semibold bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 transition cursor-pointer duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#84d46c]/50 uppercase w-fit"
    >
      {authenticated ? 'Wallet Connected' : 'Connect Wallet'}
    </button>
  );
}
