import { refreshTokenCache } from "@/utils/token-cache";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await refreshTokenCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to refresh cache" },
      { status: 500 }
    );
  }
}
