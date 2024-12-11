"use client";

import { useState, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import DragDropWrapper from "@/components/DragDropWrapper";

interface TokenResult {
  id: number;
  name: string;
  symbol: string;
  logo: string;
  rank: number;
  price?: number;
  percentChange24h?: number;
  volume24h?: number;
  marketCap?: number;
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
  onClearAll: () => void;
  onReorder: (tokens: SearchToken[]) => void;
}

export default function SearchBar({
  onTokenSelect,
  selectedTokens,
  onSearch,
  onClearAll,
  onReorder,
}: SearchBarProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedFetch = useCallback(
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
        setResults(data.tokens || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [setIsLoading, setResults]
  );

  useEffect(() => {
    if (search.length >= 2) {
      debouncedFetch(search);
      return () => {
        debouncedFetch.cancel();
      };
    } else {
      setResults([]);
    }
  }, [search, debouncedFetch]);

  const handleTokenSelect = (token: TokenResult) => {
    onTokenSelect(token);
  };

  const handleConfirmSelection = () => {
    setSearch("");
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="w-full max-w-md mb-8">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search cryptocurrencies..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
        />

        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}

        {showDropdown && results.length > 0 && (
          <div className="absolute w-full mt-2 border border-gray-300 rounded-lg shadow-lg bg-white z-50">
            <div className="max-h-96 overflow-y-auto">
              {results.map((token) => (
                <div
                  key={token.id}
                  onClick={() => handleTokenSelect(token)}
                  className={`p-4 hover:bg-blue-50 cursor-pointer text-gray-900 border-b last:border-b-0 ${
                    selectedTokens.some((t) => t.id === token.id)
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <img
                        src={token.logo}
                        alt={`${token.name} logo`}
                        className="w-8 h-8 mr-3 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png";
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.name}</span>
                          <span className="text-sm text-gray-500">
                            ({token.symbol})
                          </span>
                          {token.rank && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              #{token.rank}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {selectedTokens.some((t) => t.id === token.id) ? (
                        <span className="text-blue-500">✓</span>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Click to select
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 p-3 border-t border-gray-200 bg-white">
              <button
                onClick={handleConfirmSelection}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Confirm Selection ({selectedTokens.length} tokens)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Tokens Display */}
      {selectedTokens.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Selected Tokens: {selectedTokens.length}
              </span>
              <span className="text-xs text-gray-400 italic">
                (drag to reorder)
              </span>
            </div>
            <button
              onClick={onClearAll}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <DragDropWrapper
            selectedTokens={selectedTokens}
            onTokenSelect={onTokenSelect}
            onReorder={onReorder}
          />
        </div>
      )}

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
          : "Compare Selected Tokens"}
      </button>
    </div>
  );
}
