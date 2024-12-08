import { NextResponse } from "next/server";

interface CoinMarketCapToken {
  id: number;
  name: string;
  symbol: string;
  rank: number;
  platform?: {
    token_address: string;
  };
}

interface CoinMarketCapSearchResponse {
  data: {
    cryptoCurrencyList: CoinMarketCapToken[];
  };
  status: {
    error_code: number;
    error_message: string | null;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ tokens: [] });
  }

  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=${encodeURIComponent(
    query.toUpperCase()
  )}`;

  // Log curl command for debugging
  console.log(`\nCURL command for search:
curl '${url}' \\
  -H 'X-CMC_PRO_API_KEY: ${process.env.CMC_API_KEY}'`);

  try {
    console.log(`Searching for: ${query}`);
    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=${encodeURIComponent(
        query.toUpperCase()
      )}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      console.error(`API Response not OK: ${response.status}`);
      throw new Error(`Failed to fetch from CoinMarketCap: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (!data.data) {
      console.log("No data returned from API");
      return NextResponse.json({ tokens: [] });
    }

    const tokens = data.data.slice(0, 10).map((token: CoinMarketCapToken) => ({
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${token.id}.png`,
    }));

    console.log("Processed tokens:", tokens);
    return NextResponse.json({ tokens });
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
