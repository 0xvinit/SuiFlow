# Quest System

An educational quest system for the Suiflow platform that helps users learn about cross-chain swaps through interactive discovery.

## Components

### QuestManager
- Global quest modal manager
- Discovery banner
- Progress tracking
- Located at: `./QuestManager.tsx`

### QuestTrigger  
- Contextual quest triggers throughout the UI
- Hover and click interactions
- Positioning and styling
- Located at: `./QuestTrigger.tsx`

### Quest (Legacy)
- Standalone quest component (deprecated in favor of QuestManager)
- Located at: `./Quest.tsx`

## Context & Hooks

### QuestContext
- Global state management for quests
- Provider wraps entire app in layout.tsx
- Located at: `../contexts/QuestContext.tsx`

### useQuests Hook
- Quest state logic and data
- Quest management functions
- Located at: `../hooks/useQuests.ts`

## Quest Placements

1. **HTLC Quest** - Near "Secure Swap" button (SwappingDetails)
2. **Dutch Auction** - Exchange rate display (SwappingDetails) 
3. **Resolvers** - Estimated time field (SwappingDetails)
4. **Partial Fills** - Transaction details toggle (SwappingDetails)
5. **Cross-Chain Coordination** - Swap confirmation button (SwappingDetails)

## Usage

```tsx
import QuestTrigger from '../Quest/QuestTrigger';

// Basic usage
<QuestTrigger questId="htlc">
  <button>Secure Swap</button>
</QuestTrigger>

// Hover-only trigger
<QuestTrigger questId="dutch-auction" hoverOnly={true}>
  <div>Exchange Rate</div>
</QuestTrigger>
```

## Styling

- Consistent with app theme (#84d46c green)
- VT323 font family
- Dark theme with glassmorphism effects
- Responsive design
- Framer Motion animations