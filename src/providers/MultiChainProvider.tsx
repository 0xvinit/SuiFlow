"use client";
import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface MultiChainProviderProps {
  children: React.ReactNode;
}

// Create a client
const queryClient = new QueryClient();

export const MultiChainProvider: React.FC<MultiChainProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
        config={{
          loginMethods: ['email', 'wallet'],
          appearance: {
            theme: 'dark',
            accentColor: '#84d46c',
            logo: undefined,
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
            requireUserPasswordOnCreate: false,
          },
          defaultChain: {
            id: 421614, // Arbitrum Sepolia
            name: 'Arbitrum Sepolia',
            nativeCurrency: {
              name: 'Arbitrum ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://sepolia-rollup.arbitrum.io/rpc'],
              },
              public: {
                http: ['https://sepolia-rollup.arbitrum.io/rpc'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Arbiscan',
                url: 'https://sepolia.arbiscan.io',
              },
            },
          },
          supportedChains: [
            {
              id: 421614, // Arbitrum Sepolia
              name: 'Arbitrum Sepolia',
              nativeCurrency: {
                name: 'Arbitrum ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: {
                default: {
                  http: ['https://sepolia-rollup.arbitrum.io/rpc'],
                },
                public: {
                  http: ['https://sepolia-rollup.arbitrum.io/rpc'],
                },
              },
              blockExplorers: {
                default: {
                  name: 'Arbiscan',
                  url: 'https://sepolia.arbiscan.io',
                },
              },
            },
          ],
        }}
      >
        <SuiClientProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </SuiClientProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}; 