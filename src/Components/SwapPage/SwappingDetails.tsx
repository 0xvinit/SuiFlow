import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { parseEther } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useCompleteSwap } from '@/hooks/useSwap';
import { useMultiChainWallet } from '@/hooks/useMultiChainWallet';

interface SwappingDetailsProps {
  ethAmount?: string; // ETH amount from inputValue1
  selectedToken1?: string; // First token (usually ETH)
  selectedToken2?: string; // Second token (usually SUI)
  selectedChain1?: string; // First chain (usually Arbitrum)
  selectedChain2?: string; // Second chain (usually Sui)
  destinationAddress?: string; // User-provided destination address
}

const SwappingDetails: React.FC<SwappingDetailsProps> = ({
  ethAmount = "0",
  selectedToken1 = "ETH",
  selectedToken2 = "SUI",
  selectedChain1 = "arbitrum",
  selectedChain2 = "sui",
  destinationAddress = ""
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Privy authentication and wallets
  const { ready, authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  
  // Get Ethereum wallet from Privy - Debug wallet detection
  console.log('🔍 Debug Privy Wallets:', { ready, authenticated, wallets });
  console.log('🔍 Wallet details:', wallets.map(w => ({ 
    address: w.address, 
    walletClientType: w.walletClientType, 
    chainType: w.chainType,
    connectorType: w.connectorType 
  })));
  
  // Try multiple ways to find Ethereum wallet - more robust detection
  const ethWallet = wallets.find((wallet) => {
    // Check various possible properties that indicate Ethereum wallet
    const hasEthAddress = wallet.address && wallet.address.startsWith('0x') && wallet.address.length === 42;
    const isEthType = wallet.walletClientType === 'ethereum';
    const isEthChain = wallet.chainType === 'ethereum';
    const isEthConnector = wallet.connectorType && (
      wallet.connectorType.includes('ethereum') ||
      wallet.connectorType.includes('metamask') ||
      wallet.connectorType.includes('injected') ||
      wallet.connectorType.includes('wallet_connect')
    );
    
    return hasEthAddress || isEthType || isEthChain || isEthConnector;
  }) || wallets[0]; // Fallback to first wallet if none found by type
  
  const ethConnected = ready && authenticated && !!ethWallet && !!ethWallet.address;
  
  console.log('🔍 ETH Wallet Found:', { ethWallet, ethConnected });
  
  // Sui wallet (still using useMultiChainWallet for Sui)
  const { account: suiAccount } = useMultiChainWallet();
  
  // Swap functionality
  const {
    isLoading: swapLoading,
    logs,
    clearLogs,
    swapEthToSui,
    swapSuiToEth,
    // calculateEthToSuiAmount, // TODO: Will be needed for dynamic rate calculation
    // calculateSuiToEthAmount, // TODO: Will be needed for dynamic rate calculation
    transactionHistory,
    showTransactionHistory
  } = useCompleteSwap()

  // Only require source wallet connection, not destination
  const isEthToSui = selectedToken1 === "ETH" && selectedToken2 === "SUI" && 
                     selectedChain1 === "arbitrum" && selectedChain2 === "sui";
  const isSuiToEth = selectedToken1 === "SUI" && selectedToken2 === "ETH" && 
                     selectedChain1 === "sui" && selectedChain2 === "arbitrum";

  // Check source wallet connection based on swap direction
  const sourceWalletConnected = isEthToSui ? ethConnected : (isSuiToEth ? suiAccount?.address : false);
  const isLoading = swapLoading

  // Validate destination address format
  const isValidDestinationAddress = destinationAddress && destinationAddress.trim().length > 0;

  // Calculate converted amounts (simplified conversion rates)
  const ethAmountNumber = parseFloat(ethAmount) || 0;
  const convertedSuiAmount = isEthToSui ? ethAmountNumber * 1000 : 0; // 1 ETH = 1000 SUI
  const convertedEthAmount = isSuiToEth ? ethAmountNumber / 1000 : 0; // 1000 SUI = 1 ETH

  // Handle swap button click
  const handleSwap = async () => {
    // Check Privy authentication first
    if (!ready) {
      alert('Privy is not ready yet. Please wait...');
      return;
    }

    if (!authenticated) {
      alert('Please authenticate with Privy first');
      try {
        await login();
        return;
      } catch (error) {
        console.error('Privy login failed:', error);
        alert('Failed to authenticate. Please try again.');
        return;
      }
    }

    if (!sourceWalletConnected) {
      alert(`Please connect your ${isEthToSui ? 'Ethereum' : 'Sui'} wallet (source chain)`)
      return
    }

    if (!isValidDestinationAddress) {
      alert('Please provide a valid destination address')
      return
    }

    if (!isConfirmed) {
      alert('Please confirm the swap details first');
      return;
    }

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    clearLogs()

    try {
      if (isEthToSui) {
        console.log('🚀 Starting ETH → SUI swap...');
        const ethAmountBigInt = parseEther(ethAmount);
        console.log(`💰 Amount: ${ethAmount} ETH (${ethAmountBigInt} wei)`);
        console.log(`📍 Destination: ${destinationAddress} (SUI)`);
        
        const result = await swapEthToSui(ethAmountBigInt, destinationAddress);
        
        if (result.success) {
          console.log('✅ ETH → SUI swap completed successfully!');
          console.log('📋 Transaction details:', result);
          alert(`Swap successful! Transaction: ${result.ethTxHash}`);
        } else {
          console.error('❌ ETH → SUI swap failed:', result.error);
          alert(`Swap failed: ${result.error}`);
        }
      } else if (isSuiToEth) {
        console.log('🚀 Starting SUI → ETH swap...');
        const suiAmount = BigInt(parseFloat(ethAmount) * 1e9);
        console.log(`💰 Amount: ${ethAmount} SUI (${suiAmount} MIST)`);
        console.log(`📍 Destination: ${destinationAddress} (ETH)`);
        
        const result = await swapSuiToEth(suiAmount, destinationAddress);
        
        if (result.success) {
          console.log('✅ SUI → ETH swap completed successfully!');
          console.log('📋 Transaction details:', result);
          alert(`Swap successful! Transaction: ${result.suiTxHash}`);
        } else {
          console.error('❌ SUI → ETH swap failed:', result.error);
          alert(`Swap failed: ${result.error}`);
        }
      } else {
        alert('Unsupported swap direction. Please select ETH↔SUI for cross-chain swaps.');
      }
    } catch (error) {
      console.error('💥 Swap execution failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Swap failed: ${errorMessage}`);
    }
  };

  // Determine button text and disabled state
  const getButtonText = () => {
    console.log('🔍 Button State Debug:', {
      ready,
      isLoading,
      authenticated,
      sourceWalletConnected,
      isEthToSui,
      ethConnected,
      suiAccount: !!suiAccount?.address,
      isValidDestinationAddress,
      isConfirmed,
      ethAmount,
      ethAmountValid: !!(ethAmount && parseFloat(ethAmount) > 0)
    });
    
    if (!ready) return 'Loading Privy...';
    if (isLoading) return 'Processing...';
    if (!authenticated) return 'Login with Privy';
    if (!sourceWalletConnected) return `Connect ${isEthToSui ? 'Ethereum' : 'Sui'} Wallet`;
    if (!isValidDestinationAddress) return 'Enter Destination Address';
    if (!isConfirmed) return 'Confirm Swap';
    if (!ethAmount || parseFloat(ethAmount) <= 0) return 'Enter Amount';
    return 'Swap';
  };

  const isButtonDisabled = !ready || isLoading || (!authenticated && ready) || !sourceWalletConnected || !isValidDestinationAddress || !isConfirmed || !ethAmount || parseFloat(ethAmount) <= 0;

  return (
    <div className="bg-black border border-[#84d46c]/20 grid-pattern h-auto w-[670px] mx-auto rounded-lg text-white">
      {/* Checkbox with confirmation message */}
      <div className="flex items-center justify-between gap-3 px-4 py-6">
        <div className="flex items-start gap-3 pr-4">
          <input
            type="checkbox"
            id="confirm"
            checked={isConfirmed}
            onChange={() => setIsConfirmed(!isConfirmed)}
            className="accent-[#84d46c] mt-3"
            disabled={isLoading}
          />
          <label htmlFor="confirm" className="text-[23px] text-white/80">
            I confirm that I've reviewed the details and want to proceed with this swap.
          </label>
        </div>
        {/* Toggle Details Button */}
        <button
          className="text-[16px] text-[#84d46c] font-medium flex items-center gap-1 hover:underline"
          onClick={() => setShowDetails(!showDetails)}
          disabled={isLoading}
        >
          {showDetails ? 'Hide' : 'Details'}
          {showDetails ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
        </button>
      </div>

      {/* Animated Details Section */}
      <div
        className={`transition-all duration-300 ease-in-out mx-4 overflow-hidden rounded-lg border border-white/10 bg-[#17191a] ${
          showDetails ? 'max-h-[524px] opacity-100 p-4 mb-6' : 'max-h-0 opacity-0 p-0'
        }`}
      >
        <div className="grid grid-cols-2 gap-y-3 text-xl">
          <div className="text-white/60">Network Fee</div>
          <div className="text-right text-white/90">--</div>

          <div className="text-white/60">You'll Receive</div>
          <div className="text-right text-white/90">
            {isEthToSui && convertedSuiAmount > 0 
              ? `${convertedSuiAmount.toFixed(6)} SUI`
              : isSuiToEth && convertedEthAmount > 0
              ? `${convertedEthAmount.toFixed(6)} ETH`
              : '--'
            }
          </div>

          <div className="text-white/60">Estimated Time</div>
          <div className="text-right text-white/90">~1 min</div>

          <div className="text-white/60">Price Impact</div>
          <div className="text-right text-white/90">0.23%</div>
        </div>

        {/* Wallet Connection Status */}
        <div className="mt-4 p-3 bg-black/50 rounded border border-white/10">
          <div className="text-sm text-white/70 mb-2">Connection Status:</div>
          <div className="text-xs text-white/60">
            <div>Privy Ready: {ready ? '✅ Ready' : '⏳ Loading...'}</div>
            <div>Privy Auth: {authenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
            <div>Source Wallet ({isEthToSui ? 'Ethereum' : 'Sui'}): {sourceWalletConnected ? '✅ Connected' : '❌ Not Connected'}</div>
            {isEthToSui && ethWallet?.address && (
              <div className="ml-2 text-white/50">ETH: {ethWallet.address.slice(0, 6)}...{ethWallet.address.slice(-4)}</div>
            )}
            {isSuiToEth && suiAccount?.address && (
              <div className="ml-2 text-white/50">SUI: {suiAccount.address.slice(0, 6)}...{suiAccount.address.slice(-4)}</div>
            )}
            <div>Destination Address: {isValidDestinationAddress ? '✅ Provided' : '❌ Required'}</div>
            {destinationAddress && (
              <div className="ml-2 text-white/50">{destinationAddress.slice(0, 6)}...{destinationAddress.slice(-4)}</div>
            )}
          </div>
        </div>

        {/* Swap Logs Section */}
        {logs.length > 0 && (
          <div className="mt-4 p-3 bg-black/50 rounded border border-white/10">
            <div className="text-sm text-white/70 mb-2">Swap Progress:</div>
            <div className="max-h-32 overflow-y-auto text-xs text-white/60">
              {logs.map((log: string, index: number) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History Section */}
        {showTransactionHistory && (
          <div className="mt-4 p-3 bg-black/50 rounded border border-white/10">
            <div className="text-sm text-white/70 mb-2">Transaction History:</div>
            <div className="text-xs text-white/60 space-y-1">
              {transactionHistory.ethSentTxHashes.length > 0 && (
                <div>
                  <div className="text-white/80">ETH Sent:</div>
                  {transactionHistory.ethSentTxHashes.map((hash, index) => (
                    <div key={index} className="ml-2">
                      <a 
                        href={`https://sepolia.arbiscan.io/tx/${hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#84d46c] hover:underline"
                      >
                        {hash.slice(0, 10)}...{hash.slice(-6)}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              {transactionHistory.suiReceivedTxHashes.length > 0 && (
                <div>
                  <div className="text-white/80">SUI Received:</div>
                  {transactionHistory.suiReceivedTxHashes.map((hash, index) => (
                    <div key={index} className="ml-2">
                      <a 
                        href={`https://suiexplorer.com/txblock/${hash}?network=testnet`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#84d46c] hover:underline"
                      >
                        {hash.slice(0, 10)}...{hash.slice(-6)}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              {transactionHistory.suiSentTxHashes.length > 0 && (
                <div>
                  <div className="text-white/80">SUI Sent:</div>
                  {transactionHistory.suiSentTxHashes.map((hash, index) => (
                    <div key={index} className="ml-2">
                      <a 
                        href={`https://suiexplorer.com/txblock/${hash}?network=testnet`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#84d46c] hover:underline"
                      >
                        {hash.slice(0, 10)}...{hash.slice(-6)}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              {transactionHistory.ethReceivedTxHashes.length > 0 && (
                <div>
                  <div className="text-white/80">ETH Received:</div>
                  {transactionHistory.ethReceivedTxHashes.map((hash, index) => (
                    <div key={index} className="ml-2">
                      <a 
                        href={`https://sepolia.arbiscan.io/tx/${hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#84d46c] hover:underline"
                      >
                        {hash.slice(0, 10)}...{hash.slice(-6)}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clear Logs Button */}
      {logs.length > 0 && (
        <div className="px-4 pb-4">
          <button 
            className="w-full py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-medium text-sm transition-colors duration-200"
            onClick={clearLogs}
            disabled={isLoading}
          >
            Clear Logs
          </button>
        </div>
      )}

      {/* Swap Button */}
      <button 
        className={`w-full py-3 rounded-b-lg uppercase text-black font-bold text-[28px] transition-all duration-200 ${
          isButtonDisabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-br from-[#fff] to-[#84d46c] shadow-inner shadow-[#84d46c]/30 cursor-pointer hover:shadow-[#84d46c]/50'
        }`}
        onClick={!authenticated && ready ? login : handleSwap}
        disabled={isButtonDisabled}
      >
        {getButtonText()}
      </button>
    </div>
  );
};

export default SwappingDetails;