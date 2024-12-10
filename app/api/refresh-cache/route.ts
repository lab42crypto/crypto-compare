import { NextResponse } from "next/server";
import { refreshTokenCache } from "@/utils/token-cache";

export async function POST() {
  try {
    await refreshTokenCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to refresh cache:", error);
    return NextResponse.json(
      { error: "Failed to refresh cache" },
      { status: 500 }
    );
  }
}
