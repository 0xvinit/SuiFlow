import arbitrum from "@/assets/Images/arbone.svg";
import eth from "@/assets/Images/eth.svg";
import usdc from "@/assets/Images/usdc.svg";
import usdt from "@/assets/Images/usdt.svg";
import sui from "@/assets/Images/sui.png";

export type ChainKey = "arbitrum" | "sui";

export interface Token {
  name: string;
  icon: any;
}

export interface Chain {
  name: string;
  key: ChainKey;
  icon: any;
}

export const chains: Chain[] = [
  { name: "Arbitrum", key: "arbitrum", icon: arbitrum },
  { name: "Sui", key: "sui", icon: sui },
];

export const tokensByChain: Record<ChainKey, Token[]> = {
  arbitrum: [
    { name: "ETH", icon: eth },
    { name: "USDT", icon: usdt },
    { name: "USDC", icon: usdc },
    { name: "ARB", icon: arbitrum },
  ],
  sui: [
    { name: "USDT", icon: usdt },
    { name: "USDC", icon: usdc },
    { name: "SUI", icon: sui },
  ],
};
