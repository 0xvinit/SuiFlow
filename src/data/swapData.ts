import { StaticImageData } from "next/image";
import arbitrum from "@/assets/Images/arbone.svg";
import eth from "@/assets/Images/eth.svg";
import usdc from "@/assets/Images/usdc.svg";
import usdt from "@/assets/Images/usdt.svg";
import sui from "@/assets/Images/sui.png";

export type ChainKey = "arbitrum" | "sui";

export interface Token {
  name: string;
  icon: string | StaticImageData;
  enabled: boolean;
}

export interface Chain {
  name: string;
  key: ChainKey;
  icon: string | StaticImageData;
}

export const chains: Chain[] = [
  { name: "Arbitrum", key: "arbitrum", icon: arbitrum },
  { name: "Sui", key: "sui", icon: sui },
];

export const tokensByChain: Record<ChainKey, Token[]> = {
  arbitrum: [
    { name: "ETH", icon: eth, enabled: true },
    { name: "USDT", icon: usdt, enabled: false },
    { name: "USDC", icon: usdc, enabled: false },
    { name: "ARB", icon: arbitrum, enabled: false },
  ],
  sui: [
    { name: "SUI", icon: sui, enabled: true },
    { name: "USDT", icon: usdt, enabled: false },
    { name: "USDC", icon: usdc, enabled: false },
  ],
};
