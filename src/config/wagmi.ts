import { createConfig, http } from 'wagmi'
import { arbitrumSepolia } from 'viem/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ 
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'default-project-id' 
    }),
  ],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
})