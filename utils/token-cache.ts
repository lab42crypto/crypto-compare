import fs from "fs/promises";
import path from "path";
import type { CoinMarketCapToken } from "@/types/coinmarketcap";

interface TokenListCache {
  tokens: CoinMarketCapToken[];
  timestamp: number;
  expiresIn: number;
}

const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_FILE = path.join(CACHE_DIR, "token-list-cache.json");
const CACHE_DURATION = parseInt(
  process.env.TOKEN_LIST_CACHE_DURATION || "14400000"
); // 4 hours default

// Add function to ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

export async function getCachedTokenList(): Promise<CoinMarketCapToken[]> {
  try {
    // Try to read cache file
    const cacheData = await fs.readFile(CACHE_FILE, "utf-8");
    const cache: TokenListCache = JSON.parse(cacheData);

    // Check if cache is still valid
    if (Date.now() - cache.timestamp < cache.expiresIn) {
      console.log("Using cached token list");
      return cache.tokens;
    }

    // Cache expired, fetch new data
    return await fetchAndCacheTokenList();
  } catch (error) {
    // If file doesn't exist or is invalid, fetch new data
    console.log("No valid cache found, fetching fresh data");
    return await fetchAndCacheTokenList();
  }
}

async function fetchAndCacheTokenList(): Promise<CoinMarketCapToken[]> {
  await ensureCacheDir();
  console.log("Fetching fresh token list");

  const PAGE_SIZE = 5000;

  // Fetch both pages concurrently
  const [firstPageTokens, secondPageTokens] = await Promise.all([
    fetchTokenPage(1, PAGE_SIZE),
    fetchTokenPage(PAGE_SIZE + 1, PAGE_SIZE),
  ]);

  const allTokens = [...firstPageTokens, ...secondPageTokens];
  console.log(`Total tokens fetched: ${allTokens.length}`);

  // Save to cache file
  const cache: TokenListCache = {
    tokens: allTokens,
    timestamp: Date.now(),
    expiresIn: CACHE_DURATION,
  };

  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  return allTokens;
}

async function fetchTokenPage(
  start: number,
  limit: number
): Promise<CoinMarketCapToken[]> {
  console.log(`Fetching tokens from ${start} to ${start + limit - 1}`);
  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=${start}&limit=${limit}&convert=USD`;

  const response = await fetch(url, {
    headers: {
      "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY || "",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch token list: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

export async function refreshTokenCache(): Promise<void> {
  console.log("Manually refreshing token cache");
  await fetchAndCacheTokenList();
}

export async function getLastUpdateTime(): Promise<number | null> {
  try {
    const cacheData = await fs.readFile(CACHE_FILE, "utf-8");
    const cache: TokenListCache = JSON.parse(cacheData);
    return cache.timestamp;
  } catch {
    return null;
  }
}
