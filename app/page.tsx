"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import ComparisonTable from "@/components/ComparisonTable";
import MetricsChart from "@/components/MetricsChart";
import type { SearchToken } from "@/types/token";
import html2canvas from "html2canvas";

export default function Home() {
  const [selectedTokens, setSelectedTokens] = useState<SearchToken[]>([]);
  const [searchResults, setSearchResults] = useState<TokenResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleTokenSelect = (token: SearchToken) => {
    if (!selectedTokens.find((t) => t.id === token.id)) {
      setSelectedTokens([...selectedTokens, token]);
    } else {
      setSelectedTokens(selectedTokens.filter((t) => t.id !== token.id));
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
        Object.entries(data).map(([id, metrics]) => ({
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

  const handleDownloadAll = async () => {
    const tableElement = document.querySelector("#comparison-table");
    const chartsElement = document.querySelector("#metrics-charts");

    if (!tableElement || !chartsElement) return;

    try {
      // Create a temporary container
      const container = document.createElement("div");
      container.style.backgroundColor = "#ffffff";
      container.style.padding = "20px";

      // Capture table
      const tableCanvas = await html2canvas(tableElement as HTMLElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
      });

      // Capture charts
      const chartsCanvas = await html2canvas(chartsElement as HTMLElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        logging: false,
        imageTimeout: 15000,
      });

      // Create final canvas
      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");
      if (!ctx) return;

      // Set dimensions
      finalCanvas.width = Math.max(tableCanvas.width, chartsCanvas.width);
      finalCanvas.height = tableCanvas.height + chartsCanvas.height + 20; // 20px gap

      // Draw white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Draw table and charts
      ctx.drawImage(tableCanvas, 0, 0);
      ctx.drawImage(chartsCanvas, 0, tableCanvas.height + 20);

      // Download
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

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Crypto Comparison</h1>

      <SearchBar
        onTokenSelect={handleTokenSelect}
        selectedTokens={selectedTokens}
        onSearch={handleSearch}
        onClearAll={() => setSelectedTokens([])}
        onReorder={handleReorder}
      />

      {isSearching ? (
        <div className="text-center mt-8">Loading...</div>
      ) : (
        searchResults.length > 0 && (
          <>
            <div id="comparison-table">
              <ComparisonTable
                results={searchResults}
                selectedTokens={selectedTokens}
                onDownloadAll={handleDownloadAll}
              />
            </div>
            <div id="metrics-charts">
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
