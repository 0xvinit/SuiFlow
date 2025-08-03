import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { parseEther } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import { useCompleteSwap } from '@/hooks/useSwap';
import { useMultiChainWallet } from '@/hooks/useMultiChainWallet';

interface SwappingDetailsProps {
  ethAmount?: string; // ETH amount from inputValue1
  selectedToken1?: string; // First token (usually ETH)
  selectedToken2?: string; // Second token (usually SUI)
  selectedChain1?: string | null; // First chain (usually Arbitrum)
  selectedChain2?: string | null; // Second chain (usually Sui)
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
  
  // Privy EVM wallet connections
  const { authenticated, user } = usePrivy();
  const ethAddress = user?.wallet?.address;
  const ethConnected = authenticated && !!ethAddress;
  
  console.log('🔍 Privy Wallet Status:', { ethAddress, ethConnected, authenticated });
  
  // Sui wallet (using useMultiChainWallet for both EVM and Sui)
  const { account: suiAccount, suiWallet: suiWalletInfo } = useMultiChainWallet();
  
  console.log('🔍 SUI Wallet Status:', { 
    suiWalletInfo, 
    suiAccount, 
    suiConnected: suiWalletInfo.connected && !!suiAccount?.address 
  });
  
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
    showTransactionHistory,
    testWalletConnection
  } = useCompleteSwap()

  // Only require source wallet connection, not destination
  const isEthToSui = selectedToken1 === "ETH" && selectedToken2 === "SUI" && 
                     selectedChain1 === "arbitrum" && selectedChain2 === "sui";
  const isSuiToEth = selectedToken1 === "SUI" && selectedToken2 === "ETH" && 
                     selectedChain1 === "sui" && selectedChain2 === "arbitrum";

  // Check source wallet connection based on swap direction
  const suiConnected = suiWalletInfo.connected && !!suiAccount?.address;
  const sourceWalletConnected = isEthToSui ? ethConnected : (isSuiToEth ? suiConnected : false);
  const isLoading = swapLoading

  // Validate destination address format
  const isValidDestinationAddress = destinationAddress && destinationAddress.trim().length > 0;

  // Calculate converted amounts (simplified conversion rates)
  const ethAmountNumber = parseFloat(ethAmount) || 0;
  const convertedSuiAmount = isEthToSui ? ethAmountNumber * 1000 : 0; // 1 ETH = 1000 SUI
  const convertedEthAmount = isSuiToEth ? ethAmountNumber / 1000 : 0; // 1000 SUI = 1 ETH
  
  // Use calculated values for display
  const convertedValue = isEthToSui ? convertedSuiAmount.toString() : convertedEthAmount.toString();
  const inputValue1 = ethAmount;

  // Handle swap button click
  const handleSwap = async () => {
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
      isLoading,
      sourceWalletConnected,
      isEthToSui,
      ethConnected,
      suiConnected,
      suiAccount: !!suiAccount?.address,
      isValidDestinationAddress,
      isConfirmed,
      ethAmount,
      ethAmountValid: !!(ethAmount && parseFloat(ethAmount) > 0)
    });
    
    if (isLoading) return 'Processing...';
    if (!sourceWalletConnected) return `Connect ${isEthToSui ? 'Ethereum' : 'Sui'} Wallet`;
    if (!isValidDestinationAddress) return 'Enter Destination Address';
    if (!isConfirmed) return 'Confirm Swap';
    if (!ethAmount || parseFloat(ethAmount) <= 0) return 'Enter Amount';
    return 'Swap';
  };

  const isButtonDisabled = isLoading || !sourceWalletConnected || !isValidDestinationAddress || !isConfirmed || !ethAmount || parseFloat(ethAmount) <= 0;

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
            className="accent-[#84d46c] mt-3 w-5 h-5 cursor-pointer"
            disabled={isLoading}
          />
          <label htmlFor="confirm" className="text-[23px] text-white/80 cursor-pointer">
            I confirm that I&apos;ve reviewed the details and want to proceed with this swap.
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

          <div className="text-white/60">You&apos;ll Receive</div>
          <div className="text-right text-white/90">
            {isLoading ? (
              <span className="text-gray-400">Calculating...</span>
            ) : convertedValue && parseFloat(convertedValue) > 0 ? (
              `${convertedValue} ${selectedToken2}`
            ) : (
              <span className="text-gray-400">--</span>
            )}
          </div>

          <div className="text-white/60">Exchange Rate</div>
          <div className="text-right text-white/90">
            {isLoading ? (
              <span className="text-gray-400">--</span>
            ) : convertedValue && inputValue1 && parseFloat(inputValue1) > 0 && parseFloat(convertedValue) > 0 ? (
              `1 ${selectedToken1} = ${(parseFloat(convertedValue) / parseFloat(inputValue1)).toFixed(6)} ${selectedToken2}`
            ) : (
              <span className="text-gray-400">--</span>
            )}
          </div>

          <div className="text-white/60">Estimated Time</div>
          <div className="text-right text-white/90">~1 min</div>
        </div>

        {/* Wallet Connection Status */}
        <div className="mt-4 p-3 bg-black/50 rounded border border-white/10">
          <div className="text-sm text-white/70 mb-2">Connection Status:</div>
          <div className="text-xs text-white/60">
            <div>Source Wallet ({isEthToSui ? 'Ethereum' : 'Sui'}): {sourceWalletConnected ? '✅ Connected' : '❌ Not Connected'}</div>
            {isEthToSui && ethAddress && (
              <div className="ml-2 text-white/50">ETH: {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}</div>
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

      {/* Test Wallet Connection Button */}
      <div className="px-4 pb-2">
        <button 
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors duration-200"
          onClick={testWalletConnection}
          disabled={isLoading}
        >
          Test Wallet Connection
        </button>
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
        onClick={handleSwap}
        disabled={isButtonDisabled}
      >
        {getButtonText()}
      </button>
    </div>
  );
};

export default SwappingDetails;