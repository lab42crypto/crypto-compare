"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import type { TokenResult } from "@/types/token";

interface MetricsChartProps {
  results: TokenResult[];
  selectedTokens: string[];
}

interface ChartConfig {
  id: string;
  title: string;
  key: keyof TokenResult | ((result: TokenResult) => number);
  label: string;
  color: string;
  format?: (value: number) => string;
  getColor?: (value: number) => string;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatFollowers(value: number): string {
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toLocaleString();
}

export default function MetricsChart({
  results,
  selectedTokens,
}: MetricsChartProps) {
  const sortedResults = selectedTokens
    .map((symbol) => results.find((result) => result.symbol === symbol))
    .filter((result): result is TokenResult => result !== undefined);

  const chartConfigs: ChartConfig[] = [
    {
      id: "twitterFollowers",
      title: "Community Size Comparison",
      key: "twitterFollowers",
      label: "Twitter Followers",
      color: "rgb(29, 161, 242)",
      format: formatFollowers,
    },
    {
      id: "marketCap",
      title: "Market Cap Comparison",
      key: "marketCap",
      label: "Market Cap",
      color: "rgb(255, 99, 132)",
      format: formatMarketCap,
    },
    {
      id: "fullyDilutedMarketCap",
      title: "Fully Diluted Value Comparison",
      key: "fullyDilutedMarketCap",
      label: "FDV",
      color: "rgb(153, 102, 255)",
      format: formatMarketCap,
    },
    {
      id: "turnoverRate",
      title: "24h Turnover Rate Comparison",
      key: (result) => (result.volume24h / result.marketCap) * 100,
      label: "24h Turnover Rate (%)",
      color: "rgb(75, 192, 192)",
      format: (value) => `${value.toFixed(2)}%`,
      getColor: (value) =>
        value >= 100 ? "rgb(249, 115, 22)" : "rgb(75, 192, 192)",
    },
  ];

  return (
    <div className="w-full mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {chartConfigs.map((config) => (
          <ChartSection
            key={config.id}
            config={config}
            results={sortedResults}
          />
        ))}
      </div>
    </div>
  );
}

function ChartSection({
  config,
  results,
}: {
  config: ChartConfig;
  results: TokenResult[];
}) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!chartRef.current || !results.length) return;

    const getValue = (result: TokenResult) =>
      typeof config.key === "function"
        ? config.key(result)
        : result[config.key];

    const chart = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: results.map((result) => result.symbol),
        datasets: [
          {
            label: config.label,
            data: results.map((result) => getValue(result)),
            backgroundColor: results.map((result) => {
              const value = getValue(result);
              const color = config.getColor?.(value) || config.color;
              return `${color}4D`;
            }),
            borderColor: results.map((result) => {
              const value = getValue(result);
              return config.getColor?.(value) || config.color;
            }),
            borderWidth: 1,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: config.title,
            font: {
              size: 14,
              weight: "bold",
            },
            padding: 10,
          },
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw as number;
                return config.format ? config.format(value) : value.toString();
              },
            },
          },
        },
        backgroundColor: "#ffffff",
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) =>
                config.format ? config.format(value as number) : value,
            },
          },
        },
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
        },
      },
      plugins: [
        {
          id: "customDataLabels",
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            chart.data.datasets.forEach((dataset, datasetIndex) => {
              const meta = chart.getDatasetMeta(datasetIndex);
              if (!meta.hidden) {
                meta.data.forEach((element, index) => {
                  const value = dataset.data[index] as number;
                  const formattedValue = config.format
                    ? config.format(value)
                    : value.toString();

                  ctx.fillStyle = config.color;
                  ctx.font = "bold 11px Arial";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "bottom";
                  ctx.fillText(formattedValue, element.x, element.y - 5);
                });
              }
            });
          },
        },
        {
          id: "watermark",
          beforeDraw: (chart) => {
            const ctx = chart.ctx;
            const { width, height } = chart;

            ctx.save();
            ctx.globalAlpha = 0.05; // Very light opacity
            ctx.font = "bold 30px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000000";
            ctx.rotate((-45 * Math.PI) / 180); // Rotate -45 degrees

            // Calculate position to center the watermark
            const text = "@lab42crypto";
            const textWidth = ctx.measureText(text).width;
            const x = (width - textWidth) / 2;
            const y = height / 2;

            // Draw watermark multiple times to create a pattern
            for (let i = -1; i <= 1; i++) {
              for (let j = -1; j <= 1; j++) {
                ctx.fillText(text, x + i * textWidth * 1.5, y + j * 100);
              }
            }

            ctx.restore();
          },
        },
        {
          id: "customCanvasBackgroundColor",
          beforeDraw: (chart, args, options) => {
            const { ctx } = chart;
            ctx.save();
            ctx.globalCompositeOperation = "destination-over";
            ctx.fillStyle = options.color || "#ffffff";
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          },
        },
      ],
    });

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, chartRef.current.width, chartRef.current.height);
    }

    return () => chart.destroy();
  }, [results, config]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="h-[250px] bg-white">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
