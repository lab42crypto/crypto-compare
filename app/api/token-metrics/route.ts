import { NextResponse } from "next/server";
import type { TokenResult } from "@/types/token";
import { scrapeTwitterFollowers } from "@/utils/twitter-scraper";
import { getCachedFollowers, cacheFollowers } from "@/utils/cache";

interface Platform {
  id: string;
  name: string;
  slug: string;
  symbol: string;
  token_address: string;
}

interface ContractAddress {
  contract_address: string;
  platform: {
    name: string;
    coin: {
      id: string;
      name: string;
      symbol: string;
      slug: string;
    };
  };
}

interface CoinMarketCapMetadata {
  data: {
    [key: string]: {
      id: number;
      name: string;
      symbol: string;
      category: string;
      description: string;
      slug: string;
      logo: string;
      subreddit: string;
      notice: string;
      tags: string[] | null;
      urls: {
        website: string[];
        twitter: string[];
        message_board: string[];
        chat: string[];
        facebook: string[];
        explorer: string[];
        reddit: string[];
        technical_doc: string[];
        source_code: string[];
        announcement: string[];
      };
      platform: Platform;
      date_added: string;
      twitter_username: string;
      contract_address: ContractAddress[];
    };
  };
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
    notice: null;
  };
}

interface TokenDataResponse {
  id: number;
  name: string;
  symbol: string;
  total_supply: number;
  circulating_supply: number;
  quote: {
    USD: {
      price: number;
      market_cap: number;
      fully_diluted_market_cap: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
    };
  };
}

async function getTwitterFollowers(
  username: string
): Promise<{ followers: number; suspended: boolean }> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    console.log("Twitter API response:", JSON.stringify(data, null, 2));

    if (data.status === 429) {
      console.log("Twitter API rate limit exceeded, falling back to crawler");
      return getTwitterFollowersByCrawler(username);
    }

    if (!data.data?.public_metrics?.followers_count) {
      console.error("Invalid Twitter API response:", data);
      return getTwitterFollowersByCrawler(username);
    }

    return {
      followers: data.data.public_metrics.followers_count,
      suspended: false,
    };
  } catch (error) {
    console.error("Error fetching Twitter followers:", error);
    return getTwitterFollowersByCrawler(username);
  }
}

async function getTwitterFollowersByCrawler(
  username: string
): Promise<{ followers: number; suspended: boolean }> {
  try {
    // Check cache first
    const cachedFollowers = await getCachedFollowers(username);
    if (cachedFollowers !== null) {
      return cachedFollowers;
    }

    // If not in cache, scrape and cache the result
    const twitterUrl = `https://twitter.com/${username}`;
    console.log("Scraping Twitter followers from:", twitterUrl);

    const scrapedData = await scrapeTwitterFollowers(twitterUrl);
    console.log(`Followers for ${username}:`, scrapedData);

    // Cache the result with suspended status
    await cacheFollowers(
      username,
      scrapedData.followers,
      scrapedData.suspended
    );

    return scrapedData;
  } catch (error) {
    console.error("Error scraping Twitter followers:", error);
    return { followers: 0, suspended: false };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids")?.split(",");

  if (!ids || ids.length === 0) {
    return NextResponse.json(
      { error: "Token IDs parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch basic metrics
    const metricsResponse = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${ids.join(
        ","
      )}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY || "",
        },
      }
    );

    if (!metricsResponse.ok) {
      throw new Error(`Failed to fetch metrics: ${metricsResponse.status}`);
    }

    const metricsData = await metricsResponse.json();

    // Log the metrics data for debugging
    console.log("Metrics Data:", JSON.stringify(metricsData, null, 2));

    // Fetch metadata for social info
    const metadataResponse = await fetch(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id=${ids.join(
        ","
      )}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY || "",
        },
      }
    );
    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`);
    }

    const metadataData: CoinMarketCapMetadata = await metadataResponse.json();

    // Log the metadata for debugging
    console.log("Metadata:", JSON.stringify(metadataData, null, 2));

    const result: Record<string, TokenResult> = {};

    for (const [id, tokenData] of Object.entries(metricsData.data)) {
      const data = tokenData as TokenDataResponse;
      const metadata = metadataData.data[id];
      const twitterUsername = metadata?.twitter_username;

      const twitterData = twitterUsername
        ? await getTwitterFollowersByCrawler(twitterUsername)
        : { followers: 0, suspended: false };

      result[id] = {
        id: parseInt(id),
        name: data.name,
        symbol: data.symbol,
        logo:
          metadata?.logo ||
          `https://s2.coinmarketcap.com/static/img/coins/64x64/${data.id}.png`,
        price: data.quote.USD.price,
        marketCap:
          data.quote.USD.market_cap || data.quote.USD.fully_diluted_market_cap,
        fullyDilutedMarketCap:
          data.quote.USD.fully_diluted_market_cap || data.quote.USD.market_cap,
        volume24h: data.quote.USD.volume_24h,
        totalSupply: data.total_supply,
        circulatingSupply: data.circulating_supply,
        maxSupply: null,
        percentChange24h: data.quote.USD.percent_change_24h,
        rank: data.cmc_rank,
        // Required fields from TokenResult interface with default values
        volumeChange24h: data.quote.USD.volume_change_24h || 0,
        percentChange1h: data.quote.USD.percent_change_1h || 0,
        percentChange7d: data.quote.USD.percent_change_7d || 0,
        percentChange30d: data.quote.USD.percent_change_30d || 0,
        percentChange60d: data.quote.USD.percent_change_60d || 0,
        percentChange90d: data.quote.USD.percent_change_90d || 0,
        circulatingSupplyPercent: 0,
        dominance: 0,
        turnover: 0,
        twitterFollowers: twitterData.followers,
        twitterSuspended: twitterData.suspended,
        redditSubscribers: 0,
        githubCommits: 0,
        githubStars: 0,
        githubContributors: 0,
        liquidityScore: 0,
        volatility24h: 0,
        marketPairs: data.num_market_pairs,
        // Social links
        website: metadata?.urls?.website?.[0] || null,
        twitter: metadata?.urls?.twitter?.[0] || null,
        telegram:
          metadata?.urls?.chat?.find((url) => url.includes("t.me")) || null,
        reddit: metadata?.urls?.reddit?.[0] || null,
        github: metadata?.urls?.source_code?.[0] || null,
        twitterUsername: metadata?.twitter_username || null,
        telegramUsername: null,
        circulatingMarketCap: data.quote.USD.market_cap,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Token metrics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch token metrics" },
      { status: 500 }
    );
  }
}
