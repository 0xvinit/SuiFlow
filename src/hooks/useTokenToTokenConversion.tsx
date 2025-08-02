// hooks/useTokenToTokenConversion.ts
import { useTokenUSDValue } from "@/hooks/useTokenPrice";

export const useTokenToTokenConversion = (
  tokenA: string,
  tokenB: string,
  amountA: string
) => {
  const { usdValue: usdFromTokenA, isLoading: loadingA } = useTokenUSDValue(tokenA, amountA);
  const { usdValue: usdFromTokenB, isLoading: loadingB } = useTokenUSDValue(tokenB, "1");

  const isLoading = loadingA || loadingB;

  let convertedValue = "0.000000";
  if (!isLoading && Number(usdFromTokenA) > 0 && Number(usdFromTokenB) > 0) {
    convertedValue = (Number(usdFromTokenA) / Number(usdFromTokenB)).toFixed(6);
  }

  return { convertedValue, isLoading };
};
