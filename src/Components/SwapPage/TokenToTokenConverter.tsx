
import { useTokenUSDValue } from "@/hooks/useTokenPrice";

const TokenToTokenConverter = ({
  tokenA,
  tokenB,
  amountA,
}: {
  tokenA: string;
  tokenB: string;
  amountA: string;
}) => {
  const { usdValue: usdFromTokenA, isLoading: loadingA } = useTokenUSDValue(tokenA, amountA);
  const { usdValue: usdFromTokenB, isLoading: loadingB } = useTokenUSDValue(tokenB, "1");

  const tokenBAmount =
    Number(usdFromTokenA) > 0 && Number(usdFromTokenB) > 0
      ? Number(usdFromTokenA) / Number(usdFromTokenB)
      : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Token A → USD */}
      <div className="flex justify-between">
        <span className="text-white opacity-70">Token A ({tokenA}) to USD</span>
        <span className="text-white text-lg">
          {loadingA ? "Loading..." : usdFromTokenA ? `$${Number(usdFromTokenA).toFixed(2)}` : "-"}
        </span>
      </div>

      {/* USD → Token B */}
      <div className="flex justify-between">
        <span className="text-white opacity-70">Converted to Token B ({tokenB})</span>
        <span className="text-white text-lg">
          {loadingA || loadingB ? "Loading..." : tokenBAmount.toFixed(6)}
        </span>
      </div>
    </div>
  );
};

export default TokenToTokenConverter;
