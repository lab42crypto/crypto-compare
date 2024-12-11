"use client";

import { RefObject } from "react";
import type { TokenResult, SearchToken } from "@/types/token";
import { formatPrice } from "@/utils/formatters";

interface ComparisonTableProps {
  results: TokenResult[];
  selectedTokens: SearchToken[];
  tableContentRef: RefObject<HTMLDivElement>;
}

export default function ComparisonTable({
  results,
  selectedTokens,
  tableContentRef,
}: ComparisonTableProps) {
  const sortedResults = selectedTokens
    .map((token) => results.find((result) => result.id === token.id))
    .filter((result): result is TokenResult => result !== undefined);

  // Format current time to UTC hour
  const currentTime = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    hour12: true,
    timeZone: "UTC",
  });

  const rows = [
    { key: "rank", label: "Rank", format: (value: number) => `#${value}` },
    {
      key: "price",
      label: "Price",
      format: (value: number) => formatPrice(value),
    },
    {
      key: "marketCap",
      label: "Market Cap",
      format: (value: number) => `$${value?.toLocaleString() || "N/A"}`,
    },
    {
      key: "fullyDilutedMarketCap",
      label: "Fully Diluted Value",
      format: (value: number) => `$${value?.toLocaleString() || "N/A"}`,
    },
    {
      key: "volume24h",
      label: "24h Volume",
      format: (value: number) => `$${value?.toLocaleString() || "N/A"}`,
    },
    {
      key: "percentChange24h",
      label: "24h Change",
      format: (value: number) => `${value?.toFixed(2)}%`,
      className: (value: number) =>
        value >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      key: "turnover",
      label: "24h Turnover Rate",
      format: (value: number) => `${value?.toFixed(2)}%`,
    },
    {
      key: "totalSupply",
      label: "Total Supply",
      format: (value: number) => value?.toLocaleString() || "N/A",
    },
    {
      key: "circulatingSupply",
      label: "Circulating Supply",
      format: (value: number) => value?.toLocaleString() || "N/A",
    },
    {
      key: "circulatingSupplyPercent",
      label: "Circulating/Total %",
      format: (_: any, result: TokenResult) => {
        const effectiveCirculating =
          !result.circulatingSupply && result.totalSupply
            ? result.totalSupply
            : result.circulatingSupply;
        return effectiveCirculating && result.totalSupply
          ? `${((effectiveCirculating / result.totalSupply) * 100).toFixed(2)}%`
          : "N/A";
      },
    },
    {
      key: "twitter",
      label: "Twitter",
      format: (value?: string) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            {value}
          </a>
        ) : (
          "N/A"
        ),
    },
    {
      key: "twitterFollowers",
      label: "Twitter Followers",
      format: (value: number, result: TokenResult) =>
        result.twitterSuspended
          ? "Account Suspended"
          : value > 0
          ? value.toLocaleString()
          : "N/A",
    },
  ];

  return (
    <div className="w-full mt-4">
      <div
        ref={tableContentRef}
        className="overflow-x-auto bg-white rounded-lg"
      >
        <div className="relative min-w-max">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "transparent",
              zIndex: 1,
              width: "100%",
              height: "100%",
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="absolute transform -rotate-45"
                style={{
                  left: `${(i % 3) * 33}%`,
                  top: `${Math.floor(i / 3) * 33}%`,
                  fontSize: "24px",
                  color: "rgba(0, 0, 0, 0.05)",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                @lab42crypto
              </div>
            ))}
          </div>
          <table className="min-w-full bg-white border border-gray-200 shadow-lg rounded-lg relative z-2">
            <thead className="bg-gray-50">
              {/* Add new title row */}
              <tr>
                <th
                  colSpan={sortedResults.length + 1}
                  className="px-6 py-4 border-b text-center text-lg font-semibold text-gray-900"
                >
                  <div className="flex items-center justify-center gap-4">
                    <span className="flex items-center text-base leading-none">
                      {currentTime} UTC
                    </span>
                    <span className="text-gray-400">|</span>
                    <div className="flex flex-wrap items-center gap-3">
                      {sortedResults.map((result) => (
                        <div
                          key={result.id}
                          className="inline-block"
                          style={{ lineHeight: "20px" }}
                        >
                          <img
                            src={result.logo}
                            alt={`${result.symbol} logo`}
                            className="w-5 h-5 rounded-full inline-block align-middle"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png";
                            }}
                          />
                          <span className="font-medium inline-block align-middle ml-1">
                            {result.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </th>
              </tr>
              {/* Existing header row */}
              <tr>
                <th className="px-6 py-4 border-b text-left text-sm font-semibold text-gray-900">
                  Metric
                </th>
                {sortedResults.map((result) => (
                  <th
                    key={result.id}
                    className="px-6 py-4 border-b text-left text-sm font-semibold text-gray-900"
                  >
                    <div className="flex items-center space-x-2">
                      <img
                        src={result.logo}
                        alt={`${result.name} logo`}
                        className="w-5 h-5 rounded-full"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png";
                        }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {result.name}
                        </div>
                        <div className="text-blue-500 text-xs">
                          {result.symbol}
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-xs font-medium text-gray-600">
                    {row.label}
                  </td>
                  {sortedResults.map((result: TokenResult) => (
                    <td
                      key={result.id}
                      className={`px-6 py-4 text-sm font-mono whitespace-nowrap ${
                        row.className?.(
                          result[row.key as keyof TokenResult] as number
                        ) || "text-gray-900"
                      }`}
                    >
                      {row.format(
                        result[row.key as keyof TokenResult] as never,
                        result
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
