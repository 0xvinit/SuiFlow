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
            accentColor: '#676FFF',
          },
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