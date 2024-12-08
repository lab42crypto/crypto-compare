import fs from "fs/promises";
import path from "path";

interface CacheEntry {
  value: number;
  timestamp: number;
}

interface Cache {
  [key: string]: CacheEntry;
}

const CACHE_FILE = path.join(process.cwd(), "twitter-followers-cache.json");
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export async function getCachedFollowers(
  username: string
): Promise<number | null> {
  try {
    const cache = await loadCache();
    const entry = cache[username];

    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      console.log(`Using cached followers for ${username}`);
      return entry.value;
    }
    return null;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
}

export async function cacheFollowers(
  username: string,
  followers: number
): Promise<void> {
  try {
    const cache = await loadCache();
    cache[username] = {
      value: followers,
      timestamp: Date.now(),
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error("Error writing cache:", error);
  }
}

async function loadCache(): Promise<Cache> {
  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}
