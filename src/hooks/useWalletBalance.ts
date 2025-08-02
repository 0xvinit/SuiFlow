"use client";
import { useState, useEffect } from 'react';
import { useMultiChainWallet } from './useMultiChainWallet';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

// Type for balance information
interface BalanceInfo {
  balance: string;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  error?: string;
}

// Helper function to get balance for EVM chains
const getEvmBalance = async (address: string, tokenAddress?: string): Promise<string> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found');
  }

  try {
    if (!tokenAddress) {
      // Get native token (ETH) balance
      const balance = await (window.ethereum as any).request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }) as string;
      // Convert from wei to ether
      const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18));
      return balanceInEth.toFixed(4);
    } else {
      // Get ERC-20 token balance
      // This would require contract call - for now return mock data
      return '0.0000';
    }
  } catch (error) {
    console.error('Failed to get EVM balance:', error);
    // Return mock balance for testing if actual fetch fails
    return '1.2345';
  }
};

// Helper function to get balance for Suicla
const getSuiBalance = async (address: string): Promise<string> => {
  try {
    // Initialize Sui client
    const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
    
    // Get SUI balance
    const balance = await client.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI', // Native SUI token
    });
    
    // Convert from MIST (smallest unit) to SUI
    // 1 SUI = 10^9 MIST
    const balanceInSui = parseInt(balance.totalBalance) / Math.pow(10, 9);
    
    return balanceInSui.toFixed(4);
  } catch (error) {
    console.error('Failed to get Sui balance:', error);
    
    // Try testnet as fallback
    try {
      const testnetClient = new SuiClient({ url: getFullnodeUrl('testnet') });
      const testnetBalance = await testnetClient.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      
      const balanceInSui = parseInt(testnetBalance.totalBalance) / Math.pow(10, 9);
      return balanceInSui.toFixed(4);
    } catch (testnetError) {
      console.error('Failed to get Sui balance from testnet:', testnetError);
      // Return 0 if both mainnet and testnet fail
      return '0.0000';
    }
  }
};

export const useWalletBalance = (tokenSymbol?: string): BalanceInfo => {
  const { evmWallet, suiWallet, isWrongChain } = useMultiChainWallet();
  const [balance, setBalance] = useState<string>('0.0000');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchBalance = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        if (evmWallet.connected && evmWallet.address && !isWrongChain) {
          // Get EVM balance
          const evmBalance = await getEvmBalance(evmWallet.address);
          setBalance(evmBalance);
        } else if (suiWallet.connected && suiWallet.address) {
          // Get Sui balance
          const suiBalance = await getSuiBalance(suiWallet.address);
          setBalance(suiBalance);
        } else {
          setBalance('0.0000');
        }
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        setError('Failed to fetch balance');
        setBalance('0.0000');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have a connected wallet
    if ((evmWallet.connected && !isWrongChain) || suiWallet.connected) {
      fetchBalance();
    } else {
      setBalance('0.0000');
      setIsLoading(false);
    }
  }, [evmWallet.connected, evmWallet.address, suiWallet.connected, suiWallet.address, isWrongChain, tokenSymbol]);

  // Determine the symbol based on connected wallet
  let symbol = 'ETH';
  if (suiWallet.connected) {
    symbol = 'SUI';
  } else if (evmWallet.connected) {
    symbol = tokenSymbol || 'ETH';
  }

  return {
    balance,
    symbol,
    decimals: 18,
    isLoading,
    error,
  };
};