import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_FILE = path.join(CACHE_DIR, "token-list-cache.json");

export async function GET() {
  try {
    const cacheData = await fs.readFile(CACHE_FILE, "utf-8");
    const cache = JSON.parse(cacheData);
    return NextResponse.json({ lastUpdate: cache.timestamp });
  } catch {
    return NextResponse.json({ lastUpdate: null });
  }
}
