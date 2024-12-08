"use client";

import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";

interface TokenResult {
  id: number;
  name: string;
  symbol: string;
  logo: string;
}

interface SearchToken {
  id: number;
  name: string;
  symbol: string;
  logo: string;
}

interface SearchBarProps {
  onTokenSelect: (token: SearchToken) => void;
  selectedTokens: SearchToken[];
  onSearch: () => void;
}

export default function SearchBar({
  onTokenSelect,
  selectedTokens,
  onSearch,
}: SearchBarProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchResults = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const data = await response.json();
        console.log("Search results:", data);
        setResults(data.tokens || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (search.length >= 2) {
      fetchResults(search);
    } else {
      setResults([]);
    }
  }, [search, fetchResults]);

  const handleTokenSelect = (token: TokenResult) => {
    onTokenSelect({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      logo: token.logo,
    });
    setSearch("");
    setResults([]);
  };

  return (
    <div className="w-full max-w-md mb-8">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cryptocurrencies..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
        />

        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}

        {results.length > 0 && (
          <div className="absolute w-full mt-2 border border-gray-300 rounded-lg shadow-lg bg-white z-50 max-h-60 overflow-y-auto">
            {results.map((token) => (
              <div
                key={token.id}
                onClick={() => handleTokenSelect(token)}
                className={`p-3 hover:bg-blue-100 cursor-pointer text-gray-900 flex items-center justify-between ${
                  selectedTokens.some((t) => t.symbol === token.symbol)
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div className="flex items-center">
                  <img
                    src={token.logo}
                    alt={`${token.name} logo`}
                    className="w-6 h-6 mr-2 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png";
                    }}
                  />
                  <div>
                    <span className="font-medium">{token.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({token.symbol})
                    </span>
                  </div>
                </div>
                {selectedTokens.some((t) => t.symbol === token.symbol) && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Tokens Display */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selectedTokens.map((token) => (
          <div
            key={token.symbol}
            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
          >
            <img
              src={token.logo}
              alt={`${token.name} logo`}
              className="w-4 h-4 mr-2 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png";
              }}
            />
            {token.symbol}
            <button
              onClick={() => onTokenSelect(token)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        disabled={selectedTokens.length === 0}
        className={`mt-4 w-full py-2 px-4 rounded-lg ${
          selectedTokens.length > 0
            ? "bg-blue-500 hover:bg-blue-600 text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {selectedTokens.length === 0
          ? "Select tokens to compare"
          : selectedTokens.length === 5
          ? "Maximum tokens selected"
          : "Compare Selected Tokens"}
      </button>
    </div>
  );
}
