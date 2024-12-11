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

const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_FILE = path.join(CACHE_DIR, "twitter-followers-cache.json");
const CACHE_DURATION = parseInt(
  process.env.TWITTER_CACHE_DURATION || "14400000"
); // 4 hours default

// eslint-disable-next-line prefer-const
let memoryCache: Cache = {};

const isVercel = process.env.VERCEL === "1";

async function ensureCacheDir() {
  if (isVercel) return;
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

export async function getCachedFollowers(
  username: string
): Promise<{ followers: number; suspended: boolean } | null> {
  try {
    if (isVercel) {
      const entry = memoryCache[username];
      if (!entry || Date.now() - entry.timestamp > CACHE_DURATION) {
        return null;
      }
      if (entry.suspended) {
        console.log(`Account ${username} is suspended (cached)`);
        return { followers: 0, suspended: true };
      }
      if (entry.value === 0) {
        return null;
      }
      console.log(`Using cached followers for ${username}`);
      return { followers: entry.value, suspended: false };
    }

    // File-based caching for local development
    await ensureCacheDir();
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    const cache = JSON.parse(data);
    const entry = cache[username];

    if (!entry || Date.now() - entry.timestamp > CACHE_DURATION) {
      return null;
    }
    if (entry.suspended) {
      console.log(`Account ${username} is suspended (cached)`);
      return { followers: 0, suspended: true };
    }
    if (entry.value === 0) {
      return null;
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
    if (isVercel) {
      const existingEntry = memoryCache[username];
      const followerCount =
        followers === 0 && existingEntry?.value
          ? existingEntry.value
          : followers;

      memoryCache[username] = {
        value: followerCount,
        timestamp: Date.now(),
        suspended,
      };
      return;
    }

    // File-based caching for local development
    await ensureCacheDir();
    const cache = await loadCache();
    const existingEntry = cache[username];
    const followerCount =
      followers === 0 && existingEntry?.value ? existingEntry.value : followers;

    cache[username] = {
      value: followerCount,
      timestamp: Date.now(),
      suspended,
    };

    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error("Error writing cache:", error);
  }
}

async function loadCache(): Promise<Cache> {
  if (isVercel) {
    return memoryCache;
  }
  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}
