"use client";
import React from 'react';
import { useWallets } from '@mysten/dapp-kit';

export const WalletDebugger: React.FC = () => {
  const wallets = useWallets();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h4 className="font-semibold text-sm mb-2">🔍 Wallet Debug Info</h4>
      <div className="text-xs space-y-1">
        <p><strong>Total wallets detected:</strong> {wallets.length}</p>
        {wallets.length === 0 ? (
          <div className="text-red-500">
            <p>❌ No wallets detected</p>
            <p className="mt-1">Make sure you have a Sui wallet extension installed and unlocked.</p>
          </div>
        ) : (
          <div>
            <p className="text-green-500">✅ Wallets found:</p>
            {wallets.map((wallet, index) => (
              <div key={index} className="ml-2 mt-1 p-2 bg-gray-50 rounded">
                <p><strong>Name:</strong> {wallet.name}</p>
                <p><strong>Connected:</strong> {wallet.accounts.length > 0 ? 'Yes' : 'No'}</p>
                <p><strong>Accounts:</strong> {wallet.accounts.length}</p>
                {wallet.accounts.length > 0 && (
                  <p><strong>Address:</strong> {wallet.accounts[0].address?.slice(0, 10)}...</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
      >
        Refresh
      </button>
    </div>
  );
}; 