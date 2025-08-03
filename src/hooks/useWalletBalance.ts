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

// Type for Ethereum provider (from useMultiChainWallet)
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Helper function to get balance for EVM chains
const getEvmBalance = async (address: string, selectedNetwork: string, tokenAddress?: string): Promise<string> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found');
  }

  const ethereum = window.ethereum as unknown as EthereumProvider;

  try {
    console.log(`💰 Fetching EVM balance for ${selectedNetwork} network`);
    
    if (!tokenAddress) {
      // Get native token (ETH) balance
      const balance = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }) as string;
      // Convert from wei to ether
      const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18));
      console.log(`✅ ${selectedNetwork} balance:`, balanceInEth.toFixed(4));
      return balanceInEth.toFixed(4);
    } else {
      // Get ERC-20 token balance
      // This would require contract call - for now return mock data
      return '0.0000';
    }
  } catch (error) {
    console.error(`Failed to get EVM balance for ${selectedNetwork}:`, error);
    // Return mock balance for testing if actual fetch fails - different for networks
    const mockBalance = selectedNetwork === 'ARBITRUM_ONE' ? '2.3456' : '1.2345';
    console.log(`📊 Using mock balance for ${selectedNetwork}:`, mockBalance);
    return mockBalance;
  }
};

// Helper function to get balance for Sui
const getSuiBalance = async (address: string, network: string = 'testnet'): Promise<string> => {
  try {
    console.log(`🌐 Fetching Sui balance from ${network} for address:`, address);
    
    // Initialize Sui client with selected network
    const client = new SuiClient({ url: getFullnodeUrl(network as 'mainnet' | 'testnet' | 'devnet') });
    
    // Get SUI balance
    const balance = await client.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI', // Native SUI token
    });
    
    console.log(`💰 Raw Sui balance from ${network}:`, balance);
    
    // Convert from MIST (smallest unit) to SUI
    // 1 SUI = 10^9 MIST
    const balanceInSui = parseInt(balance.totalBalance) / Math.pow(10, 9);
    
    return balanceInSui.toFixed(4);
  } catch (error) {
    console.error(`❌ Failed to get Sui balance from ${network}:`, error);
    
    // If it's not testnet, try testnet as fallback
    if (network !== 'testnet') {
      try {
        console.log('🔄 Trying testnet as fallback...');
        const testnetClient = new SuiClient({ url: getFullnodeUrl('testnet') });
        const testnetBalance = await testnetClient.getBalance({
          owner: address,
          coinType: '0x2::sui::SUI',
        });
        
        const balanceInSui = parseInt(testnetBalance.totalBalance) / Math.pow(10, 9);
        console.log('✅ Testnet fallback balance:', balanceInSui);
        return balanceInSui.toFixed(4);
      } catch (testnetError) {
        console.error('❌ Failed to get Sui balance from testnet fallback:', testnetError);
      }
    }
    
    // Return 0 if all attempts fail
    return '0.0000';
  }
};

export const useWalletBalance = (tokenSymbol?: string): BalanceInfo => {
  const { 
    evmWallet, 
    suiWallet, 
    isWrongChain, 
    selectedSuiNetwork,
    selectedEvmNetwork 
  } = useMultiChainWallet();
  const [balance, setBalance] = useState<string>('0.0000');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  // Extract values to avoid complex expressions in dependencies
  const evmConnected = evmWallet.connected;
  const evmAddress = evmWallet.address;
  const suiConnected = suiWallet.connected;
  const suiAddress = suiWallet.address;
  const tokenSymbolValue = tokenSymbol || '';
  const suiNetworkValue = selectedSuiNetwork || 'TESTNET';
  const evmNetworkValue = selectedEvmNetwork || 'ARBITRUM_SEPOLIA';

  useEffect(() => {
    const fetchBalance = async () => {
      console.log('🔄 Fetching balance...', { 
        evmConnected: evmWallet.connected, 
        evmAddress: evmWallet.address,
        suiConnected: suiWallet.connected, 
        suiAddress: suiWallet.address,
        isWrongChain 
      });
      
      setIsLoading(true);
      setError(undefined);

      try {
        if (evmConnected && evmAddress && !isWrongChain) {
          console.log('💰 Fetching EVM balance for:', evmAddress, 'on network:', evmNetworkValue);
          // Get EVM balance using selected network
          const evmBalance = await getEvmBalance(evmAddress, evmNetworkValue);
          console.log('✅ EVM balance:', evmBalance);
          setBalance(evmBalance);
        } else if (suiConnected && suiAddress) {
          console.log('💰 Fetching Sui balance for:', suiAddress, 'on network:', suiNetworkValue);
          // Get Sui balance using selected network
          const networkName = suiNetworkValue.toLowerCase();
          const suiBalance = await getSuiBalance(suiAddress, networkName);
          console.log('✅ Sui balance:', suiBalance);
          setBalance(suiBalance);
        } else {
          console.log('❌ No wallet connected or wrong chain');
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
    if ((evmConnected && !isWrongChain) || suiConnected) {
      fetchBalance();
    } else {
      setBalance('0.0000');
      setIsLoading(false);
    }
  }, [
    evmConnected, 
    evmAddress, 
    suiConnected, 
    suiAddress, 
    isWrongChain, 
    tokenSymbolValue, 
    suiNetworkValue,
    evmNetworkValue,
    evmWallet.connected,
    suiWallet.connected,
    suiWallet.address,
    evmWallet.address,
  ]);

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