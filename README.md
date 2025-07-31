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
│   └── SwapArrow.tsx     # Center arrow
├── data/
│   └── swapData.ts       # Chain/token configuration
├── hooks/
│   └── useSwapState.ts   # State management
├── utils/
│   └── swapUtils.ts      # Utility functions
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

- [ ] Add more blockchain networks
- [ ] Implement actual swap functionality
- [ ] Add price feeds and exchange rates
- [ ] Wallet integration
- [ ] Transaction history
- [ ] Mobile responsiveness improvements
