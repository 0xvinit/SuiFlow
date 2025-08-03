# Swap Integration Documentation

## Overview
This document describes the integration of the swap functionality into the SuiFlow project. The integration connects the UI components with the swap logic to enable cross-chain swaps between ETH (Arbitrum) and SUI.

## Components Modified

### 1. SwappingDetails.tsx
- **Location**: `src/Components/SwapPage/SwappingDetails.tsx`
- **Changes**: 
  - Added props interface to receive swap parameters
  - Integrated swap state management
  - Added swap button functionality
  - Added real-time swap progress logging
  - Added dynamic amount calculations

### 2. SwapPage.tsx
- **Location**: `src/Components/SwapPage/SwapPage.tsx`
- **Changes**:
  - Updated SwappingDetails component usage to pass required props
  - Connected input values from useSwapState to SwappingDetails

## Integration Details

### Props Passed to SwappingDetails
```typescript
interface SwappingDetailsProps {
  ethAmount?: string;        // ETH amount from inputValue1
  selectedToken1?: string;   // First token (usually ETH)
  selectedToken2?: string;   // Second token (usually SUI)
  selectedChain1?: string;   // First chain (usually Arbitrum)
  selectedChain2?: string;   // Second chain (usually Sui)
}
```

### Swap Direction Detection
The component automatically detects swap direction based on selected tokens and chains:
- **ETH → SUI**: When ETH is selected on Arbitrum and SUI is selected on Sui
- **SUI → ETH**: When SUI is selected on Sui and ETH is selected on Arbitrum

### Amount Calculations
- **ETH to SUI**: 1 ETH = 1000 SUI (simplified rate)
- **SUI to ETH**: 1000 SUI = 1 ETH (simplified rate)

### Swap Process Flow
1. User enters amount in the first swap box
2. User confirms swap details by checking the checkbox
3. User clicks "Swap" button
4. Component validates inputs and shows progress logs
5. Swap simulation runs with detailed logging
6. Success/failure feedback is provided

## Features Implemented

### ✅ Completed
- [x] Props interface for swap parameters
- [x] Dynamic amount calculations
- [x] Swap direction detection
- [x] Real-time progress logging
- [x] Button state management (disabled/enabled)
- [x] Error handling and user feedback
- [x] Loading states during swap process

### 🔄 Future Enhancements
- [ ] Integration with actual useSwap hook (when linter issues are resolved)
- [ ] Real blockchain transaction execution
- [ ] Wallet connection validation
- [ ] Gas estimation
- [ ] Transaction confirmation handling

## Usage

### Basic Usage
```tsx
<SwappingDetails 
  ethAmount={inputValue1}
  selectedToken1={selectedToken1}
  selectedToken2={selectedToken2}
  selectedChain1={selectedChain1}
  selectedChain2={selectedChain2}
/>
```

### State Management
The component manages its own state for:
- Confirmation checkbox
- Details visibility
- Loading states
- Swap progress logs

## Notes

1. **Current Implementation**: The current implementation uses a simulation mode for the swap process. The actual blockchain transactions are not executed yet.

2. **useSwap Hook**: The complex useSwap hook with resolver integration is available but not currently integrated due to linter compatibility issues.

3. **Environment Variables**: The useSwap hook requires several environment variables for contract addresses and configuration.

4. **Wallet Integration**: The component is prepared for wallet integration but currently uses simulated transactions.

## Next Steps

1. Resolve linter issues in useSwap hook
2. Integrate actual blockchain transaction execution
3. Add wallet connection validation
4. Implement real-time transaction status updates
5. Add transaction history display 