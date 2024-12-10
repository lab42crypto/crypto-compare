"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import ComparisonTable from "@/components/ComparisonTable";
import MetricsChart from "@/components/MetricsChart";
import type { SearchToken, TokenResult } from "@/types/token";
import html2canvas from "html2canvas";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTokens, setSelectedTokens] = useState<SearchToken[]>([]);
  const [searchResults, setSearchResults] = useState<TokenResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const tableContentRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);

  const fetchInitialTokens = useCallback(async (ids: number[]) => {
    try {
      // First fetch token details
      const response = await fetch(`/api/token-metrics?ids=${ids.join(",")}`);
      if (!response.ok) throw new Error("Failed to fetch token data");
      const data = await response.json();

      // Convert the data to SearchToken format
      const tokens = Object.entries(data).map(
        ([id, metrics]: [string, any]) => ({
          id: parseInt(id),
          name: metrics.name,
          symbol: metrics.symbol,
          logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`,
        })
      );

      setSelectedTokens(tokens);
      setSearchResults(
        Object.entries(data).map(([id, metrics]: [string, any]) => ({
          id: parseInt(id),
          ...metrics,
        }))
      );
    } catch (error) {
      console.error("Error fetching initial tokens:", error);
    }
  }, []);

  const updateUrlParams = (tokens: SearchToken[]) => {
    const tokenIds = tokens.map((t) => t.id).join(",");
    const newUrl =
      tokens.length > 0 ? `?tokenids=${tokenIds}` : window.location.pathname;
    router.push(newUrl);
  };

  const handleTokenSelect = (token: SearchToken) => {
    if (!selectedTokens.find((t) => t.id === token.id)) {
      const newSelectedTokens = [...selectedTokens, token];
      setSelectedTokens(newSelectedTokens);
      updateUrlParams(newSelectedTokens);
    } else {
      const newSelectedTokens = selectedTokens.filter((t) => t.id !== token.id);
      setSelectedTokens(newSelectedTokens);
      updateUrlParams(newSelectedTokens);
    }
  };

  const handleSearch = async () => {
    if (selectedTokens.length === 0) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/token-metrics?ids=${selectedTokens.map((t) => t.id).join(",")}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch token data");
      }
      const data = await response.json();
      setSearchResults(
        Object.entries(data).map(([id, metrics]: [string, any]) => ({
          id: parseInt(id),
          ...metrics,
        }))
      );
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadTable = async () => {
    if (!tableContentRef.current) return;
    try {
      const canvas = await html2canvas(tableContentRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
      });

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

  const handleDownloadCharts = async () => {
    if (!chartsRef.current) return;
    try {
      const canvas = await html2canvas(chartsRef.current, {
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
      console.error("Error downloading charts:", error);
    }
  };

  const handleDownloadAll = async () => {
    if (!tableContentRef.current || !chartsRef.current) return;

    try {
      const [tableCanvas, chartsCanvas] = await Promise.all([
        html2canvas(tableContentRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          logging: false,
          imageTimeout: 15000,
        }),
        html2canvas(chartsRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          logging: false,
          imageTimeout: 15000,
        }),
      ]);

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) return;

      finalCanvas.width = Math.max(tableCanvas.width, chartsCanvas.width);
      finalCanvas.height = tableCanvas.height + chartsCanvas.height + 20;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      ctx.drawImage(tableCanvas, 0, 0);
      ctx.drawImage(chartsCanvas, 0, tableCanvas.height + 20);

      const link = document.createElement("a");
      link.download = `crypto-comparison-full-${
        new Date().toISOString().split("T")[0]
      }.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading full comparison:", error);
    }
  };

  const handleReorder = (reorderedTokens: SearchToken[]) => {
    setSelectedTokens(reorderedTokens);
  };

  const handleRefreshCache = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const response = await fetch("/api/refresh-cache", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh cache");
      }

      console.log("Cache refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh cache:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearAll = () => {
    setSelectedTokens([]);
    setSearchResults([]);
    updateUrlParams([]);
  };

  // Function to format time difference
  const formatTimeDiff = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  // Fetch last update time on mount and after refresh
  useEffect(() => {
    const fetchLastUpdate = async () => {
      try {
        const response = await fetch("/api/cache-status");
        const data = await response.json();
        setLastUpdate(data.lastUpdate);
      } catch (error) {
        console.error("Failed to fetch cache status:", error);
        setLastUpdate(null);
      }
    };
    fetchLastUpdate();
  }, [isRefreshing]);

  useEffect(() => {
    // Handle initial URL parameters
    const tokenIds = searchParams.get("tokenids");
    if (tokenIds) {
      const ids = tokenIds.split(",").map(Number);
      fetchInitialTokens(ids);
    }
  }, [fetchInitialTokens, searchParams]);

  return (
    <main className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Crypto Comparison</h1>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last updated: {formatTimeDiff(lastUpdate)}
            </span>
          )}
          <button
            onClick={handleRefreshCache}
            disabled={isRefreshing}
            className={`px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 shadow-md ${
              isRefreshing ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            <i
              className={`fas fa-sync-alt ${
                isRefreshing ? "animate-spin" : ""
              }`}
            ></i>
            {isRefreshing ? "Refreshing..." : "Refresh Token Cache"}
          </button>
        </div>
      </div>

      <SearchBar
        onTokenSelect={handleTokenSelect}
        selectedTokens={selectedTokens}
        onSearch={handleSearch}
        onClearAll={handleClearAll}
        onReorder={handleReorder}
      />

      {isSearching ? (
        <div className="text-center mt-8">Loading...</div>
      ) : (
        searchResults.length > 0 &&
        selectedTokens.length > 0 && (
          <>
            <div className="flex justify-end mb-4 gap-2">
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
              >
                <i className="fas fa-download"></i>
                Download All
              </button>
              <button
                onClick={handleDownloadTable}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
              >
                <i className="fas fa-download"></i>
                Download Table
              </button>
              <button
                onClick={handleDownloadCharts}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md"
              >
                <i className="fas fa-download"></i>
                Download Charts
              </button>
            </div>
            <div id="comparison-table">
              <ComparisonTable
                results={searchResults}
                selectedTokens={selectedTokens}
                tableContentRef={tableContentRef}
              />
            </div>
            <div id="metrics-charts" ref={chartsRef}>
              <MetricsChart
                results={searchResults}
                selectedTokens={selectedTokens}
              />
            </div>
          </>
        )
      )}
    </main>
  );
}
