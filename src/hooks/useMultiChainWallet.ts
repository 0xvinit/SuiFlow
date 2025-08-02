"use client";
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useDisconnectWallet } from '@mysten/dapp-kit';

export const useMultiChainWallet = () => {
  const { authenticated, user, login, logout } = usePrivy();
  const wallets = useWallets();
  const { mutate: disconnectSuiWallet } = useDisconnectWallet();

  // Get the first connected Sui wallet
  const suiWallet = wallets.find(wallet => wallet.accounts.length > 0);
  const suiConnected = !!suiWallet;
  const suiAccount = suiWallet?.accounts[0];

  const getWalletInfo = (chain: 'evm' | 'sui') => {
    if (chain === 'evm') {
      return {
        connected: authenticated,
        address: user?.wallet?.address,
        chain: 'evm'
      };
    } else if (chain === 'sui') {
      return {
        connected: suiConnected,
        address: suiAccount?.address,
        chain: 'sui'
      };
    }
    return null;
  };

  const connectWallet = async (chain: 'evm' | 'sui') => {
    if (chain === 'evm') {
      if (!authenticated) {
        await login();
      }
    } else if (chain === 'sui') {
      if (!suiConnected && wallets.length > 0) {
        // For Sui wallets, we need to show a wallet selector
        // The actual connection will be handled by the wallet extension
        console.log('Available Sui wallets:', wallets.map(w => w.name));
        console.log('Please select a wallet from the wallet selector');
      }
    }
  };

  const disconnectWallet = async (chain: 'evm' | 'sui') => {
    if (chain === 'evm') {
      logout();
    } else if (chain === 'sui' && suiWallet) {
      try {
        console.log('Disconnecting Sui wallet:', suiWallet.name);
        disconnectSuiWallet();
      } catch (error) {
        console.error('Failed to disconnect Sui wallet:', error);
      }
    }
  };

  const isAnyWalletConnected = authenticated || suiConnected;

  return {
    // Individual wallet states
    evmWallet: {
      connected: authenticated,
      address: user?.wallet?.address,
      connect: () => connectWallet('evm'),
      disconnect: () => disconnectWallet('evm')
    },
    suiWallet: {
      connected: suiConnected,
      address: suiAccount?.address,
      connect: () => connectWallet('sui'),
      disconnect: () => disconnectWallet('sui'),
      wallet: suiWallet
    },
    // Available Sui wallets
    availableSuiWallets: wallets,
    // Utility functions
    getWalletInfo,
    connectWallet,
    disconnectWallet,
    isAnyWalletConnected
  };
}; 