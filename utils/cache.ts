import fs from "fs/promises";
import path from "path";

interface CacheEntry {
  value: number;
  timestamp: number;
  suspended?: boolean;
}

interface Cache {
  [key: string]: CacheEntry;
}

const CACHE_FILE = path.join(process.cwd(), "twitter-followers-cache.json");
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export async function getCachedFollowers(
  username: string
): Promise<{ followers: number; suspended: boolean } | null> {
  try {
    const cache = await loadCache();
    const entry = cache[username];

    if (!entry || Date.now() - entry.timestamp > CACHE_DURATION) {
      return null;
    }

    if (entry.suspended) {
      console.log(`Account ${username} is suspended (cached)`);
      return { followers: 0, suspended: true };
    }

    if (entry.value === 0) {
      return null; // Retry if value is 0
    }

    console.log(`Using cached followers for ${username}`);
    return { followers: entry.value, suspended: false };
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
}

export async function cacheFollowers(
  username: string,
  followers: number,
  suspended: boolean
): Promise<void> {
  try {
    const cache = await loadCache();
    cache[username] = {
      value: followers,
      timestamp: Date.now(),
      suspended,
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
