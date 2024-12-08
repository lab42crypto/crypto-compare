import { useState, useEffect } from "react";

export interface TokenMetrics {
  [token: string]: {
    price: number;
    marketCap: number;
    volume24h: number;
  };
}

export function useTokenData(
  tokens: string[],
  shouldFetch: boolean,
  refreshTrigger: number
) {
  const [tokenData, setTokenData] = useState<TokenMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokenData() {
      if (!shouldFetch || tokens.length === 0) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/token-metrics?tokens=${tokens.join(",")}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch token data");
        }
        const data = await response.json();
        setTokenData(data);
      } catch (error) {
        console.error("Error fetching token data:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setTokenData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokenData();
  }, [tokens, shouldFetch, refreshTrigger]);

  return { tokenData, isLoading, error };
}
