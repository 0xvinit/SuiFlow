# SuiFlow - Modular Swap Interface

A modern, modular cryptocurrency swap interface built with Next.js, TypeScript, and Tailwind CSS.

## 🏗️ Project Structure

### Components

- **`SwapPage.tsx`** - Main container component that orchestrates the swap interface
- **`SwapBox.tsx`** - Reusable swap box component with dropdown functionality
- **`SwapArrow.tsx`** - Central swap arrow component

### Data & Types

- **`src/data/swapData.ts`** - Centralized data configuration for chains and tokens
- **`src/utils/swapUtils.ts`** - Utility functions for chain and token operations

### Hooks

- **`src/hooks/useSwapState.ts`** - Custom hook for managing swap state logic

## 🎯 Features

### Swap Boxes

- **Network Selection**: Dropdown with Arbitrum and Sui networks
- **Token Selection**: Dynamic token list based on selected network
- **Cross-Box Validation**: Prevents selecting the same network in both boxes
- **Visual Feedback**: Icons, hover states, and selection indicators

### State Management

- **Centralized State**: All swap state managed through custom hook
- **Type Safety**: Full TypeScript support with proper interfaces
- **Reactive Updates**: Automatic UI updates based on state changes

### UI/UX

- **Modern Design**: Dark theme with green accents
- **Responsive Layout**: Flexible component structure
- **Smooth Animations**: GSAP-powered transitions
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔧 Technical Implementation

### Component Architecture

```
SwapPage (Container)
├── SwapBox (Box 1)
│   ├── Network Dropdown
│   ├── Token Selection
│   └── Visual Indicators
├── SwapArrow (Center)
└── SwapBox (Box 2)
    ├── Network Dropdown
    ├── Token Selection
    └── Visual Indicators
```

### Data Flow

1. **State Management**: `useSwapState` hook manages all swap-related state
2. **Data Configuration**: `swapData.ts` provides centralized chain/token definitions
3. **Utility Functions**: `swapUtils.ts` handles data transformations
4. **Component Props**: Clean prop interfaces for component communication

### Key Benefits

- **Modularity**: Each component has a single responsibility
- **Reusability**: SwapBox can be used in different contexts
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add new chains, tokens, or features
- **Type Safety**: Full TypeScript coverage prevents runtime errors

## 🚀 Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 File Structure

```
src/
├── Components/
│   ├── SwapPage.tsx      # Main container
│   ├── SwapBox.tsx       # Reusable swap box
│   ├── SwapArrow.tsx     # Center arrow
│   └── Heading.tsx       # Animated heading with price display
├── data/
│   └── swapData.ts       # Chain/token configuration
├── hooks/
│   ├── useSwapState.ts   # State management
│   └── useTokenPrices.ts # Price fetching hook
├── utils/
│   ├── swapUtils.ts      # Utility functions
│   └── priceUtils.ts     # 1inch API integration
└── assets/
    └── Images/           # Icons and images
```

## 🎨 Design System

### Colors

- **Primary**: `#84d46c` (Green accent)
- **Background**: `#17191a` (Dark gray)
- **Border**: `rgba(255, 255, 255, 0.2)` (White with opacity)

### Components

- **SwapBox**: Rounded corners, gradient borders, hover effects
- **Dropdown**: Dark background, green highlights, smooth transitions
- **Buttons**: Gradient backgrounds, hover animations

## 🔄 Future Enhancements

- [x] Add price feeds and exchange rates (1inch API integration)
- [ ] Add more blockchain networks
- [ ] Implement actual swap functionality
- [ ] Wallet integration
- [ ] Transaction history
- [ ] Mobile responsiveness improvements

## 🔌 API Integration

### 1inch Price API

The application now integrates with the 1inch Price API to fetch real-time token prices.

#### Setup

1. Get your API key from [1inch Developer Portal](https://portal.1inch.dev/)
2. Create a `.env.local` file in the root directory
3. Add your API key:
   ```
   NEXT_PUBLIC_ONEINCH_API_KEY=your_1inch_api_key_here
   ```

#### Supported Tokens

- **ETH** (Ethereum): `0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`
- **USDT** (Ethereum): `0xdac17f958d2ee523a2206206994597c13d831ec7`
- **USDC** (Arbitrum): `0xaf88d065e77c8cc2239327c5edb3a432268e5831`
- **SUI** (Arbitrum): `0xb0505e5a99abd03d94a1169e638b78edfed26ea4`
- **ARB** (Arbitrum): `0x912ce59144191c1204e64559fe8253a0e49e6548`

#### Features

- **Real-time Prices**: Automatic price updates every 30 seconds
- **Server-side Proxy**: API calls routed through Next.js API routes to avoid CORS issues
- **Error Handling**: Graceful fallbacks for API failures with fallback prices
- **Loading States**: Smooth loading indicators during price fetches
