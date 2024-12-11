import { getLastUpdateTime } from "@/utils/token-cache";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const lastUpdate = await getLastUpdateTime();
    return NextResponse.json({ lastUpdate });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get cache status" },
      { status: 500 }
    );
  }
}
