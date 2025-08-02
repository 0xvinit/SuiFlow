"use client";
import React, { useState } from 'react';
import { useMultiChainWallet } from '@/hooks/useMultiChainWallet';
import { SuiWalletSelector } from './SuiWalletSelector';

interface MultiChainConnectProps {
  className?: string;
}

export const MultiChainConnect: React.FC<MultiChainConnectProps> = ({ className }) => {
  const { evmWallet, suiWallet, availableSuiWallets, isAnyWalletConnected } = useMultiChainWallet();
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [showSuiWalletSelector, setShowSuiWalletSelector] = useState(false);

  const handleConnect = (chain: 'evm' | 'sui') => {
    if (chain === 'evm') {
      evmWallet.connect();
    } else if (chain === 'sui') {
      setShowSuiWalletSelector(true);
    }
    setShowChainSelector(false);
  };

  const handleDisconnect = (chain: 'evm' | 'sui') => {
    if (chain === 'evm') {
      evmWallet.disconnect();
    } else if (chain === 'sui') {
      suiWallet.disconnect();
    }
  };

  const handleSuiWalletSelect = (walletName: string) => {
    console.log('Selected Sui wallet:', walletName);
    setShowSuiWalletSelector(false);
    alert(`Successfully connected to ${walletName}! Check the debug panel to see the connection status.`);
  };

  return (
    <div className={`relative ${className}`}>
      {!isAnyWalletConnected ? (
        <button
          onClick={() => setShowChainSelector(!showChainSelector)}
          className="bg-gradient-to-r from-[#84d46c] to-[#6bbf5a] text-white px-8 py-4 rounded-xl font-vt323 text-xl tracking-wider hover:from-[#6bbf5a] hover:to-[#5aa849] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center space-x-3">
          {evmWallet.connected && (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-vt323 text-sm tracking-wider shadow-md">
              EVM: {evmWallet.address?.slice(0, 6)}...{evmWallet.address?.slice(-4)}
              <button
                onClick={() => handleDisconnect('evm')}
                className="ml-3 text-white hover:text-red-200 transition-colors"
              >
                ×
              </button>
            </div>
          )}
          {suiWallet.connected && (
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-vt323 text-sm tracking-wider shadow-md">
              Sui: {suiWallet.address?.slice(0, 6)}...{suiWallet.address?.slice(-4)}
              <button
                onClick={() => handleDisconnect('sui')}
                className="ml-3 text-white hover:text-red-200 transition-colors"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chain Selector Modal */}
      {showChainSelector && !isAnyWalletConnected && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-vt323 text-white tracking-wider mb-2">Choose Network</h3>
              <p className="text-gray-400 font-vt323 text-sm">Select your preferred blockchain network</p>
            </div>
            
            <div className="space-y-4">
              {/* EVM Option */}
              <button
                onClick={() => handleConnect('evm')}
                className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl border border-blue-500 transition-all duration-300 transform hover:scale-105 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-lg">E</span>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-vt323 text-lg tracking-wider">EVM Networks</div>
                    <div className="text-blue-200 font-vt323 text-sm">Ethereum, Polygon, BSC & more</div>
                  </div>
                </div>
              </button>

              {/* Sui Option */}
              <button
                onClick={() => handleConnect('sui')}
                className="w-full p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl border border-purple-500 transition-all duration-300 transform hover:scale-105 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-vt323 text-lg tracking-wider">Sui Network</div>
                    <div className="text-purple-200 font-vt323 text-sm">Fast & scalable blockchain</div>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowChainSelector(false)}
              className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-vt323 text-sm tracking-wider transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sui Wallet Selector Modal */}
      {showSuiWalletSelector && (
        <SuiWalletSelector
          onWalletSelect={handleSuiWalletSelect}
          onClose={() => setShowSuiWalletSelector(false)}
        />
      )}
    </div>
  );
}; 