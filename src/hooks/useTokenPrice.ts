// hooks/useTokenPrices.ts
import { useEffect, useState, useRef } from "react";
import Eth from "@/assets/Images/eth.svg";
import Sui from "@/assets/Images/sui.png";
import arb from "@/assets/Images/arbone.svg";
import usdt from "@/assets/Images/usdt.svg";
import usdc from "@/assets/Images/usdc.svg";

// Cache for storing price data with timestamps
interface PriceCache {
  [key: string]: {
    price: string;
    timestamp: number;
  };
}

interface TokenWithPrice {
  name: string;
  icon: string | any;
  color: string;
  chain: number;
  address: string;
  price: string;
}

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

// Global state management
const priceCache: PriceCache = {};
const CACHE_DURATION = 60000; // 60 seconds cache (increased)
const REQUEST_DELAY = 2000; // 2 second delay between requests (increased)
const BATCH_DELAY = 5000; // 5 seconds between batch fetches

// Global state to prevent multiple simultaneous fetches
let globalTokens: TokenWithPrice[] = TOKEN_METADATA.map((token) => ({ ...token, price: "Loading..." }));
let isFetching = false;
let lastFetchTime = 0;
const subscribers: Set<(tokens: TokenWithPrice[]) => void> = new Set();

// Global price fetching function
const fetchGlobalPrices = async () => {
  if (isFetching) {
    console.log("⏳ Price fetch already in progress, skipping...");
    return;
  }

  const now = Date.now();
  if (now - lastFetchTime < BATCH_DELAY) {
    console.log("⏸️ Too soon for another batch fetch, skipping...");
    return;
  }

  isFetching = true;
  lastFetchTime = now;
  console.log("🚀 Starting global price fetch batch...");

  try {
    const updated = await Promise.all(
      TOKEN_METADATA.map(async (token, index) => {
        const cacheKey = `${token.chain}-${token.address}`;
        
        // Check cache first
        if (priceCache[cacheKey] && (now - priceCache[cacheKey].timestamp) < CACHE_DURATION) {
          console.log(`🔄 Using cached price for ${token.name}`);
          return { ...token, price: priceCache[cacheKey].price };
        }

        // Rate limit API calls with increasing delays
        return new Promise<TokenWithPrice>((resolve) => {
          setTimeout(async () => {
            try {
              console.log(`📡 Fetching fresh price for ${token.name} (delay: ${index * REQUEST_DELAY}ms)`);
              const res = await fetch(
                `/api/prices?chain=${token.chain}&address=${token.address}`
              );
              if (!res.ok) throw new Error(`Price fetch failed for ${token.name}`);
              const data = await res.json();
              const price = data[token.address];
              const formattedPrice = `$${Number(price).toFixed(2)}`;
              
              // Cache the result
              priceCache[cacheKey] = {
                price: formattedPrice,
                timestamp: now
              };
              
              resolve({ ...token, price: formattedPrice });
            } catch (error) {
              console.error(`❌ Failed to fetch price for ${token.name}:`, error);
              resolve({ ...token, price: "N/A" });
            }
          }, index * REQUEST_DELAY);
        });
      })
    );

    globalTokens = updated;
    console.log("✅ Global price fetch batch completed");
    
    // Notify all subscribers
    subscribers.forEach(callback => callback(globalTokens));
  } catch (err) {
    console.error("❌ Failed to fetch global prices:", err);
    globalTokens = TOKEN_METADATA.map((token) => ({ ...token, price: "N/A" }));
    subscribers.forEach(callback => callback(globalTokens));
  } finally {
    isFetching = false;
  }
};

const useTokenPrices = () => {
  const [tokens, setTokens] = useState<TokenWithPrice[]>(globalTokens);

  useEffect(() => {
    // Subscribe to global state updates
    const updateCallback = (newTokens: TokenWithPrice[]) => {
      setTokens(newTokens);
    };
    
    subscribers.add(updateCallback);
    
    // Set initial state from global tokens
    setTokens(globalTokens);
    
    // Trigger fetch if needed (only if prices are still loading or stale)
    const needsFetch = globalTokens.some(token => token.price === "Loading..." || token.price === "N/A") ||
                      (Date.now() - lastFetchTime) > CACHE_DURATION;
    
    if (needsFetch) {
      fetchGlobalPrices();
    }

    // Cleanup subscription on unmount
    return () => {
      subscribers.delete(updateCallback);
    };
  }, []);

  return tokens;
};

// New hook for getting USD value for a specific token and amount with debouncing
export const useTokenUSDValue = (tokenName: string | null, amount: string) => {
  const tokens = useTokenPrices();
  const [usdValue, setUsdValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedAmount, setDebouncedAmount] = useState(amount);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce amount changes to prevent excessive calculations
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 300); // 300ms debounce delay

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [amount]);

  useEffect(() => {
    if (!tokenName || !debouncedAmount || parseFloat(debouncedAmount) <= 0) {
      setUsdValue(0);
      setIsLoading(false);
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
    const amountNum = parseFloat(debouncedAmount);
    setUsdValue(price * amountNum);
  }, [tokenName, debouncedAmount, tokens]);

  return { usdValue, isLoading };
};

export default useTokenPrices;
