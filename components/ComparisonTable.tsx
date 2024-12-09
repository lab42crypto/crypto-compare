"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";
import type { TokenResult } from "@/types/token";
import { formatPrice } from "@/utils/formatters";

interface ComparisonTableProps {
  results: TokenResult[];
  selectedTokens: SearchToken[];
  onDownloadAll: () => Promise<void>;
}

export default function ComparisonTable({
  results,
  selectedTokens,
  onDownloadAll,
}: ComparisonTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!tableRef.current) return;

    try {
      // Get the scrollable container
      const scrollContainer = tableRef.current;
      const originalOverflow = scrollContainer.style.overflow;
      const originalWidth = scrollContainer.style.width;

      // Temporarily modify the container to show full content
      scrollContainer.style.overflow = "visible";
      scrollContainer.style.width = `${scrollContainer.scrollWidth}px`;

      // Pre-load images
      const images = scrollContainer.getElementsByTagName("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = () => {
              img.src =
                "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png";
              resolve();
            };
          });
        })
      );

      // Capture the full table
      const canvas = await html2canvas(scrollContainer, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
        width: scrollContainer.scrollWidth, // Set width to full scrollable width
        height: scrollContainer.scrollHeight,
        onclone: (clonedDoc: Document) => {
          const clonedImages = clonedDoc.getElementsByTagName("img");
          Array.from(clonedImages).forEach((img: HTMLImageElement) => {
            img.crossOrigin = "anonymous";
          });
        },
      });

      // Restore original container styles
      scrollContainer.style.overflow = originalOverflow;
      scrollContainer.style.width = originalWidth;

      // Download the image
      const link = document.createElement("a");
      link.download = `crypto-comparison-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading table:", error);
    }
  };

  const handleDownloadMetrics = async () => {
    const chartsElement = document.querySelector("#metrics-charts");
    if (!chartsElement) return;

    try {
      const canvas = await html2canvas(chartsElement as HTMLElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
      });

      const link = document.createElement("a");
      link.download = `crypto-metrics-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading metrics:", error);
    }
  };

  const calculateSupplyPercentage = (circulating: number, total: number) => {
    // If circulating is 0 or missing but total exists, use total as circulating
    const effectiveCirculating = !circulating && total ? total : circulating;
    if (!total || !effectiveCirculating) return 0;
    return (effectiveCirculating / total) * 100;
  };

  const sortedResults = selectedTokens
    .map((token) => results.find((result) => result.id === parseInt(token.id)))
    .filter((result): result is TokenResult => result !== undefined);

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
      format: (value: number, result: TokenResult) => {
        const rate = (result.volume24h / result.marketCap) * 100;
        return `${rate.toFixed(2)}%`;
      },
      className: (value: number, result: TokenResult) => {
        const rate = (result.volume24h / result.marketCap) * 100;
        return rate >= 100 ? "text-orange-500 font-bold" : "text-gray-900";
      },
    },
    {
      key: "totalSupply",
      label: "Total Supply",
      format: (value: number) => value?.toLocaleString() || "N/A",
    },
    {
      key: "circulatingSupply",
      label: "Circulating Supply",
      format: (value: number, result: TokenResult) => {
        // Use total supply if circulating is 0 or missing
        const effectiveValue =
          !value && result.totalSupply ? result.totalSupply : value;
        return effectiveValue?.toLocaleString() || "N/A";
      },
    },
    {
      key: "circulatingSupplyPercent",
      label: "Circulating/Total %",
      format: (_, result: TokenResult) => {
        // Use total supply if circulating is 0 or missing
        const effectiveCirculating =
          !result.circulatingSupply && result.totalSupply
            ? result.totalSupply
            : result.circulatingSupply;

        return `${calculateSupplyPercentage(
          effectiveCirculating,
          result.totalSupply
        ).toFixed(2)}%`;
      },
    },
    {
      key: "twitter",
      label: "Twitter",
      format: (value: string | null, result: TokenResult) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
          >
            <i className="fab fa-twitter"></i>
            <span>{value}</span>
          </a>
        ) : (
          <span className="text-gray-400">Not available</span>
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

  // Format current time to UTC hour
  const currentTime = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    hour12: true,
    timeZone: "UTC",
  });

  return (
    <div className="w-full mt-4">
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={onDownloadAll}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
        >
          <i className="fas fa-download"></i>
          Download All
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
        >
          <i className="fas fa-download"></i>
          Download Table
        </button>
        <button
          onClick={handleDownloadMetrics}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
        >
          <i className="fas fa-download"></i>
          Download Charts
        </button>
      </div>
      <div ref={tableRef} className="overflow-x-auto bg-white rounded-lg">
        <div className="relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "transparent",
              zIndex: 1,
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
                          key={result.symbol}
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
                    key={result.symbol}
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
                  {sortedResults.map((result) => (
                    <td
                      key={result.symbol}
                      className={`px-6 py-4 text-sm font-mono whitespace-nowrap ${
                        row.className?.(
                          result[row.key as keyof TokenResult] as number,
                          result
                        ) || "text-gray-900"
                      }`}
                    >
                      {row.format(result[row.key as keyof TokenResult], result)}
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
