"use client";
import React, { useState } from 'react';
import { useWallets, useConnectWallet, useCurrentWallet } from '@mysten/dapp-kit';

interface SuiWalletSelectorProps {
  onWalletSelect: (walletName: string) => void;
  onClose: () => void;
}

// Define available Sui wallets with their installation links
const SUI_WALLETS = [
  {
    name: 'Sui Wallet',
    alternativeNames: ['SLush Wallet', 'Slush - A Sui Wallet', 'SLush', 'Slush Wallet', 'Slush', 'SUI Wallet'],
    displayName: 'Sui Wallet (Slush)',
    description: 'Official Sui wallet',
    icon: '🔵',
    installUrl: 'https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil',
    color: 'from-blue-500 to-blue-600'
  },
  {
    name: 'Suiet',
    alternativeNames: [],
    displayName: 'Suiet',
    description: 'Modern Sui wallet',
    icon: '🟣',
    installUrl: 'https://chrome.google.com/webstore/detail/suiet/khpkpbbcccdmmclmpigdgddabeilkdpd',
    color: 'from-purple-500 to-purple-600'
  },
  {
    name: 'OKX Wallet',
    alternativeNames: [],
    displayName: 'OKX Wallet',
    description: 'Multi-chain wallet',
    icon: '🟡',
    installUrl: 'https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    name: 'Martian Wallet',
    alternativeNames: [],
    displayName: 'Martian',
    description: 'Multi-chain wallet',
    icon: '🟢',
    installUrl: 'https://chrome.google.com/webstore/detail/martian-wallet/efbglgofoippbgcjepnhiblaibcnclgk',
    color: 'from-green-500 to-green-600'
  }
];

export const SuiWalletSelector: React.FC<SuiWalletSelectorProps> = ({ onWalletSelect, onClose }) => {
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { currentWallet } = useCurrentWallet();
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [connecting, setConnecting] = useState<string>('');

  const handleWalletSelect = (walletName: string) => {
    setSelectedWallet(walletName);
  };

  const handleConnect = async () => {
    if (selectedWallet) {
      try {
        console.log('Attempting to connect to:', selectedWallet);
        setConnecting(selectedWallet);
        
        const wallet = wallets.find(w => w.name === selectedWallet);
        if (wallet) {
          // Use the proper dapp-kit connection method
          connect(
            { wallet },
            {
              onSuccess: (walletInfo) => {
                console.log('Successfully connected to:', selectedWallet, walletInfo);
                onWalletSelect(selectedWallet);
                setConnecting('');
                onClose();
              },
              onError: (error) => {
                console.error('Failed to connect to wallet:', error);
                setConnecting('');
                alert(`Failed to connect to ${selectedWallet}. Please make sure your wallet is unlocked and try again.`);
              }
            }
          );
        } else {
          setConnecting('');
          alert(`Wallet ${selectedWallet} not found. Please make sure it's installed and try again.`);
        }
      } catch (error) {
        console.error('Connection error:', error);
        setConnecting('');
        alert(`Failed to connect to ${selectedWallet}. Please try again.`);
      }
    }
  };

  // Check which wallets are available
  const availableWalletNames = wallets.map(w => w.name);
  const connectedWalletNames = wallets.filter(w => w.accounts.length > 0).map(w => w.name);
  
  // Debug: Log detected wallet names
  console.log('Detected wallets:', wallets.map(w => ({ name: w.name, accounts: w.accounts.length })));
  
  // Helper function to check if a wallet is available (including alternative names)
  const isWalletAvailable = (walletConfig: any) => {
    return availableWalletNames.includes(walletConfig.name) || 
           walletConfig.alternativeNames?.some((altName: string) => availableWalletNames.includes(altName));
  };
  
  // Helper function to check if a wallet is connected (including alternative names)
  const isWalletConnected = (walletConfig: any) => {
    return connectedWalletNames.includes(walletConfig.name) || 
           walletConfig.alternativeNames?.some((altName: string) => connectedWalletNames.includes(altName));
  };
  
  // Helper function to get the actual wallet object from detected wallets
  const getActualWallet = (walletConfig: any) => {
    return wallets.find(w => 
      w.name === walletConfig.name || 
      walletConfig.alternativeNames?.includes(w.name)
    );
  };

  // Sort wallets: available first, then unavailable
  const sortedWallets = [...SUI_WALLETS].sort((a, b) => {
    const aAvailable = isWalletAvailable(a);
    const bAvailable = isWalletAvailable(b);
    const aConnected = isWalletConnected(a);
    const bConnected = isWalletConnected(b);
    
    // Connected wallets first
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    
    // Then available wallets
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    
    // Keep original order for same status
    return 0;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-vt323 text-white tracking-wider">Select Sui Wallet</h3>
            <p className="text-gray-400 font-vt323 text-sm mt-1">
              {wallets.length > 0 ? `${wallets.length} wallet(s) detected` : 'No wallets detected'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {sortedWallets.map((wallet) => {
            const isAvailable = isWalletAvailable(wallet);
            const isConnected = isWalletConnected(wallet);
            const actualWallet = getActualWallet(wallet);
            const walletNameToUse = actualWallet?.name || wallet.name;
            const isSelected = selectedWallet === walletNameToUse;

            return (
              <div key={wallet.name} className="relative">
                {isAvailable ? (
                  // Available wallet - clickable
                  <button
                    onClick={() => handleWalletSelect(walletNameToUse)}
                    className={`w-full p-4 rounded-xl border transition-all duration-300 transform hover:scale-105 group ${
                      isSelected 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 border-purple-500 shadow-lg' 
                        : 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 hover:border-purple-500'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${
                        isSelected ? 'bg-purple-500' : 'bg-gray-600'
                      }`}>
                        {wallet.icon}
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-vt323 text-lg tracking-wider">{wallet.displayName}</span>
                          {isConnected && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Connected</span>
                          )}
                        </div>
                        <div className="text-gray-400 font-vt323 text-sm">{wallet.description}</div>
                      </div>
                    </div>
                  </button>
                ) : (
                  // Not available - show install link
                  <a
                    href={wallet.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-4 rounded-xl border border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 group block"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {wallet.icon}
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-300 font-vt323 text-lg tracking-wider">{wallet.displayName}</span>
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Install</span>
                        </div>
                        <div className="text-gray-500 font-vt323 text-sm">{wallet.description}</div>
                      </div>
                      <div className="text-gray-400 group-hover:text-white transition-colors">
                        ↗
                      </div>
                    </div>
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {selectedWallet && (
          <div className="mb-6">
            <button
              onClick={handleConnect}
              disabled={connecting === selectedWallet}
              className={`w-full py-4 px-6 rounded-xl font-vt323 text-lg tracking-wider transition-all duration-300 transform shadow-lg ${
                connecting === selectedWallet
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:scale-105'
              } text-white`}
            >
              {connecting === selectedWallet ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </span>
              ) : (
                `Connect to ${(() => {
                  const walletConfig = sortedWallets.find(w => {
                    const actualWallet = getActualWallet(w);
                    return actualWallet?.name === selectedWallet || w.name === selectedWallet;
                  });
                  return walletConfig?.displayName || selectedWallet;
                })()}`
              )}
            </button>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-gray-400 font-vt323 text-sm">
            Make sure your wallet extension is installed and unlocked
          </p>
          <p className="text-gray-500 font-vt323 text-xs mt-1">
            Click on a wallet to connect, or install a new one from the links above
          </p>
        </div>
      </div>
    </div>
  );
}; 