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

async function ensureCacheDir() {
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
    await ensureCacheDir();
    const cache = await loadCache();
    const existingEntry = cache[username];

    // If new count is 0 and we have a previous non-zero count, keep the old count
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
  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}
