import { NextResponse } from "next/server";
import { getCachedTokenList } from "@/utils/token-cache";
import type { CoinMarketCapToken } from "@/types/coinmarketcap";

function getMatchScore(token: CoinMarketCapToken, searchQuery: string): number {
  const symbol = token.symbol.toLowerCase();
  const name = token.name.toLowerCase();

  // Exact symbol match gets highest priority
  if (symbol === searchQuery) return 1000;

  // Calculate match scores
  const symbolScore = calculateMatchScore(symbol, searchQuery) * 2; // Symbol matches weighted more
  const nameScore = calculateMatchScore(name, searchQuery);

  return symbolScore + nameScore;
}

function calculateMatchScore(text: string, query: string): number {
  // Consecutive match is worth more
  const consecutiveMatchLength = getConsecutiveMatchLength(text, query);
  const consecutiveScore = consecutiveMatchLength * 10;

  // Count total matching characters
  const matchingChars = query
    .split("")
    .filter((char) => text.includes(char)).length;
  const matchRatio = matchingChars / query.length;

  // Position bonus - matches at start worth more
  const positionScore = text.startsWith(query) ? 50 : 0;

  return consecutiveScore + matchRatio * 20 + positionScore;
}

function getConsecutiveMatchLength(text: string, query: string): number {
  let maxLength = 0;
  for (let i = 0; i < text.length; i++) {
    let j = 0;
    while (
      j < query.length &&
      i + j < text.length &&
      text[i + j] === query[j]
    ) {
      j++;
    }
    maxLength = Math.max(maxLength, j);
  }
  return maxLength;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const tokenId = searchParams.get("id");

  if (tokenId) {
    // Direct token lookup by ID
    const tokens = await getCachedTokenList();
    const token = tokens.find((t) => t.id === parseInt(tokenId));
    if (token) {
      return NextResponse.json({
        tokens: [
          {
            id: token.id,
            name: token.name,
            symbol: token.symbol,
            rank: token.cmc_rank,
            logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${token.id}.png`,
          },
        ],
      });
    }
    return NextResponse.json({ tokens: [] });
  }

  if (!query) {
    return NextResponse.json({ tokens: [] });
  }

  try {
    console.log(`Searching for: ${query}`);
    const allTokens = await getCachedTokenList();
    const searchQuery = query.toLowerCase();

    // Score and sort all matching tokens
    const scoredTokens = allTokens
      .filter(
        (token) =>
          token.symbol.toLowerCase().includes(searchQuery) ||
          token.name.toLowerCase().includes(searchQuery)
      )
      .map((token) => ({
        token,
        score: getMatchScore(token, searchQuery),
      }))
      .sort((a, b) => b.score - a.score);

    const processedTokens = scoredTokens.slice(0, 50).map(({ token }) => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      rank: token.cmc_rank,
      logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${token.id}.png`,
    }));

    console.log("Processed tokens:", processedTokens);
    return NextResponse.json({ tokens: processedTokens });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        tokens: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
