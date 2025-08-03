"use client";
import { usePrivy } from '@privy-io/react-auth';
import { useWallets, useDisconnectWallet, useConnectWallet, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@mysten/sui/transactions';

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

// Supported networks
const SUPPORTED_NETWORKS = {
  ARBITRUM_ONE: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io/',
  },
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io/',
  }
};

const SUI_NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  DEVNET: 'devnet'
};

export const useMultiChainWallet = () => {
  const { authenticated, user, login, logout } = usePrivy();
  const wallets = useWallets();
  const { mutate: disconnectSuiWallet } = useDisconnectWallet();
  const { mutateAsync: connectSuiWallet } = useConnectWallet();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [selectedEvmNetwork, setSelectedEvmNetwork] = useState<keyof typeof SUPPORTED_NETWORKS>('ARBITRUM_ONE');
  const [selectedSuiNetwork, setSelectedSuiNetwork] = useState<keyof typeof SUI_NETWORKS>('TESTNET');
  const [isWrongChain, setIsWrongChain] = useState(false);
  const [isConnectingSui, setIsConnectingSui] = useState(false);

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
          
          // Auto-detect and sync selectedEvmNetwork with connected chain
          const connectedNetwork = Object.entries(SUPPORTED_NETWORKS).find(
            ([, network]) => network.chainId === chainIdNumber
          );
          
          if (connectedNetwork) {
            const [networkKey] = connectedNetwork;
            console.log(`🔗 Auto-detected network: ${networkKey} (Chain ID: ${chainIdNumber})`);
            if (selectedEvmNetwork !== networkKey) {
              setSelectedEvmNetwork(networkKey as keyof typeof SUPPORTED_NETWORKS);
            }
            setIsWrongChain(false);
          } else {
            // Chain ID doesn't match any supported network
            const targetChainId = SUPPORTED_NETWORKS[selectedEvmNetwork].chainId;
            setIsWrongChain(chainIdNumber !== targetChainId);
            console.warn(`⚠️ Connected to unsupported chain ID: ${chainIdNumber}, expected: ${targetChainId}`);
          }
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
          
          // Auto-detect and sync selectedEvmNetwork with connected chain
          const connectedNetwork = Object.entries(SUPPORTED_NETWORKS).find(
            ([, network]) => network.chainId === chainIdNumber
          );
          
          if (connectedNetwork) {
            const [networkKey] = connectedNetwork;
            console.log(`🔗 Chain changed to: ${networkKey} (Chain ID: ${chainIdNumber})`);
            if (selectedEvmNetwork !== networkKey) {
              setSelectedEvmNetwork(networkKey as keyof typeof SUPPORTED_NETWORKS);
            }
            setIsWrongChain(false);
          } else {
            // Chain ID doesn't match any supported network
            const targetChainId = SUPPORTED_NETWORKS[selectedEvmNetwork].chainId;
            setIsWrongChain(chainIdNumber !== targetChainId);
            console.warn(`⚠️ Chain changed to unsupported chain ID: ${chainIdNumber}, expected: ${targetChainId}`);
          }
        }
      };

      ethereum.on('chainChanged', handleChainChanged);
      return () => {
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [authenticated, selectedEvmNetwork]);

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
      if (!suiConnected) {
        setIsConnectingSui(true);
        try {
          // If no wallets are available, this will trigger the wallet selector
          if (wallets.length === 0) {
            console.log('No Sui wallets available. Please install a Sui wallet extension.');
            throw new Error('No Sui wallets available');
          }
          
          // If wallets are available but not connected, try to connect to the first one
          const firstWallet = wallets[0];
          if (firstWallet) {
            await connectSuiWallet({ wallet: firstWallet });
          }
        } catch (error) {
          console.error('Failed to connect Sui wallet:', error);
          throw error;
        } finally {
          setIsConnectingSui(false);
        }
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

  // Sui transaction execution method
  const executeTransaction = useCallback(async (transaction: Transaction) => {
    if (!suiAccount) {
      throw new Error('Sui wallet not connected');
    }

    // Add debugging information
    console.log('Executing Sui transaction for account:', suiAccount.address);
    console.log('Transaction object:', transaction);

    return new Promise<string>((resolve, reject) => {
      try {
        signAndExecuteTransaction(
          {
            transaction,
          },
          {
            onSuccess: (result) => {
              console.log('Sui transaction executed successfully:', result.digest);
              resolve(result.digest);
            },
            onError: (error) => {
              console.error('Failed to execute Sui transaction:', error);
              console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
              });
              reject(error);
            },
          }
        );
      } catch (error) {
        console.error('Error in signAndExecuteTransaction call:', error);
        reject(error);
      }
    });
  }, [suiAccount, signAndExecuteTransaction]);

  // Sui balance update method
  const updateBalance = useCallback(async () => {
    if (!suiWallet || !suiAccount) {
      return;
    }

    try {
      // Trigger a balance refresh by refetching the wallet data
      // This is a simple approach - in a real app you might want to use a more sophisticated balance tracking system
      console.log('Updating Sui balance for account:', suiAccount.address);
      // The actual balance update will be handled by the wallet's internal state management
    } catch (error) {
      console.error('Failed to update Sui balance:', error);
    }
  }, [suiWallet, suiAccount]);

  const switchToNetwork = async (networkKey: keyof typeof SUPPORTED_NETWORKS) => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      throw new Error('Ethereum provider not found');
    }

    const network = SUPPORTED_NETWORKS[networkKey];
    
    try {
      // Try to switch to the network
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
      setSelectedEvmNetwork(networkKey);
    } catch (switchError: unknown) {
      // If the chain is not added, add it
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.explorerUrl],
              },
            ],
          });
          setSelectedEvmNetwork(networkKey);
        } catch (addError) {
          console.error(`Failed to add ${network.name} network:`, addError);
          throw addError;
        }
      } else {
        console.error(`Failed to switch to ${network.name}:`, switchError);
        throw switchError;
      }
    }
  };

  // Legacy function for backward compatibility
  const switchToArbitrum = () => switchToNetwork('ARBITRUM_ONE');

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
      switchToArbitrum,
      switchToNetwork,
      selectedNetwork: selectedEvmNetwork,
      setSelectedNetwork: setSelectedEvmNetwork
    },
    suiWallet: {
      connected: suiConnected,
      address: suiAccount?.address,
      connect: () => connectWallet('sui'),
      disconnect: () => disconnectWallet('sui'),
      wallet: suiWallet,
      selectedNetwork: selectedSuiNetwork,
      setSelectedNetwork: setSelectedSuiNetwork,
      isConnecting: isConnectingSui
    },
    // Sui-specific methods for useSwap.ts compatibility
    account: suiAccount,
    executeTransaction,
    updateBalance,
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
    switchToNetwork,
    // Network configurations
    SUPPORTED_NETWORKS,
    SUI_NETWORKS,
    selectedEvmNetwork,
    selectedSuiNetwork,
    setSelectedEvmNetwork,
    setSelectedSuiNetwork
  };
}; 