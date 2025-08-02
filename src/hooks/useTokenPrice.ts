// hooks/useTokenPrices.ts
import { useEffect, useState } from "react";
import Eth from "@/assets/Images/eth.svg";
import Sui from "@/assets/Images/sui.png";
import arb from "@/assets/Images/arbone.svg";
import usdt from "@/assets/Images/usdt.svg";
import usdc from "@/assets/Images/usdc.svg";

export const TOKEN_METADATA = [
  {
    name: "ETH",
    icon: Eth,
    color: "#383c4c",
    chain: 1,
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  {
    name: "USDC",
    icon: usdc,
    color: "#2775CA",
    chain: 42161,
    address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  },
  {
    name: "USDT",
    icon: usdt,
    color: "#26A17B",
    chain: 1,
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
  {
    name: "SUI",
    icon: Sui,
    color: "#4ca3ff",
    chain: 42161,
    address: "0xb0505e5a99abd03d94a1169e638b78edfed26ea4",
  },
  {
    name: "ARB",
    icon: arb,
    color: "#12aaff",
    chain: 42161,
    address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
  },
];

const useTokenPrices = () => {
  const [tokens, setTokens] = useState(
    TOKEN_METADATA.map((token) => ({ ...token, price: "Loading..." }))
  );

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const updated = await Promise.all(
          TOKEN_METADATA.map(async (token) => {
            const res = await fetch(
              `/api/prices?chain=${token.chain}&address=${token.address}`
            );
            if (!res.ok) throw new Error("Price fetch failed");
            const data = await res.json();
            const price = data[token.address];
            return { ...token, price: `$${Number(price).toFixed(2)}` };
          })
        );
        setTokens(updated);
      } catch (err) {
        console.error("Failed to fetch prices:", err);
        setTokens(TOKEN_METADATA.map((token) => ({ ...token, price: "N/A" })));
      }
    };

    fetchPrices();
  }, []);

  return tokens;
};

// New hook for getting USD value for a specific token and amount
export const useTokenUSDValue = (tokenName: string | null, amount: string) => {
  const tokens = useTokenPrices();
  const [usdValue, setUsdValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!tokenName || !amount || parseFloat(amount) <= 0) {
      setUsdValue(0);
      return;
    }

    const token = tokens.find((t) => t.name === tokenName);
    if (!token || token.price === "Loading..." || token.price === "N/A") {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);
    // Extract price from "$X.XX" format
    const priceStr = token.price.replace("$", "");
    const price = parseFloat(priceStr);
    const amountNum = parseFloat(amount);
    setUsdValue(price * amountNum);
  }, [tokenName, amount, tokens]);

  return { usdValue, isLoading };
};

export default useTokenPrices;
