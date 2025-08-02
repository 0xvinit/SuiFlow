"use client";
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useDisconnectWallet } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';

// Type for Ethereum provider
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

// Helper function to get ethereum provider with proper typing
const getEthereumProvider = (): EthereumProvider | undefined => {
  if (typeof window !== 'undefined' && window.ethereum) {
    const ethereum = window.ethereum as unknown as EthereumProvider;
    // Type guard to ensure we have the required methods
    if (
      ethereum &&
      typeof ethereum.request === 'function' &&
      typeof ethereum.on === 'function' &&
      typeof ethereum.removeListener === 'function'
    ) {
      return ethereum;
    }
  }
  return undefined;
};

// Arbitrum One Chain ID
const ARBITRUM_CHAIN_ID = 42161;

export const useMultiChainWallet = () => {
  const { authenticated, user, login, logout } = usePrivy();
  const wallets = useWallets();
  const { mutate: disconnectSuiWallet } = useDisconnectWallet();
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isWrongChain, setIsWrongChain] = useState(false);

  // Get the first connected Sui wallet
  const suiWallet = wallets.find(wallet => wallet.accounts.length > 0);
  const suiConnected = !!suiWallet;
  const suiAccount = suiWallet?.accounts[0];

  // Check current chain when user is connected
  useEffect(() => {
    const checkChain = async () => {
      const ethereum = getEthereumProvider();
      if (authenticated && ethereum) {
        try {
          const chainId = await ethereum.request({ method: 'eth_chainId' });
          const chainIdNumber = parseInt(chainId as string, 16);
          setCurrentChainId(chainIdNumber);
          setIsWrongChain(chainIdNumber !== ARBITRUM_CHAIN_ID);
        } catch (error) {
          console.error('Failed to get chain ID:', error);
        }
      } else {
        setCurrentChainId(null);
        setIsWrongChain(false);
      }
    };

    checkChain();

    // Listen for chain changes
    const ethereum = getEthereumProvider();
    if (authenticated && ethereum) {
      const handleChainChanged = (...args: unknown[]) => {
        const chainId = args[0] as string;
        if (typeof chainId === 'string') {
          const chainIdNumber = parseInt(chainId, 16);
          setCurrentChainId(chainIdNumber);
          setIsWrongChain(chainIdNumber !== ARBITRUM_CHAIN_ID);
        }
      };

      ethereum.on('chainChanged', handleChainChanged);
      return () => {
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [authenticated]);

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

  const switchToArbitrum = async () => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error('Ethereum provider not found');
    }

    try {
      // Try to switch to Arbitrum
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // If the chain is not added, add it
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}`,
                chainName: 'Arbitrum One',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://arbiscan.io/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Arbitrum network:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch to Arbitrum:', switchError);
        throw switchError;
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
      disconnect: () => disconnectWallet('evm'),
      isWrongChain,
      currentChainId,
      switchToArbitrum
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
    isAnyWalletConnected,
    // Chain validation
    isWrongChain,
    currentChainId,
    switchToArbitrum,
    ARBITRUM_CHAIN_ID
  };
}; 