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
    [key: string]: Array<{
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
      twitter_followers?: number;
      contract_address: ContractAddress[];
    }>;
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

interface TokenData {
  id: number;
  name: string;
  symbol: string;
  num_market_pairs: number;
  total_supply: number;
  circulating_supply: number;
  cmc_rank: number;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
    };
  };
}

async function getTwitterFollowers(username: string): Promise<number> {
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

    return data.data.public_metrics.followers_count;
  } catch (error) {
    console.error("Error fetching Twitter followers:", error);
    return getTwitterFollowersByCrawler(username);
  }
}

async function getTwitterFollowersByCrawler(username: string): Promise<number> {
  try {
    // Check cache first
    const cachedFollowers = await getCachedFollowers(username);
    if (cachedFollowers !== null) {
      return cachedFollowers;
    }

    // If not in cache, scrape and cache the result
    const twitterUrl = `https://twitter.com/${username}`;
    console.log("Scraping Twitter followers from:", twitterUrl);

    const followers = await scrapeTwitterFollowers(twitterUrl);
    console.log(`Followers for ${username}:`, followers);

    // Cache the result
    await cacheFollowers(username, followers);

    return followers;
  } catch (error) {
    console.error("Error scraping Twitter followers:", error);
    return 0;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokens = searchParams.get("tokens")?.split(",");

  if (!tokens || tokens.length === 0) {
    return NextResponse.json(
      { error: "Tokens parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch basic metrics
    const metricsResponse = await fetch(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${tokens.join(
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
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=${tokens.join(
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

    for (const [symbol, tokenData] of Object.entries(metricsData.data)) {
      const metadataArray = metadataData.data[symbol];
      const metadata = metadataArray?.[0];
      const twitterUsername = metadata?.twitter_username;

      const followers = twitterUsername
        ? await getTwitterFollowers(twitterUsername)
        : 0;

      result[symbol] = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        logo:
          metadata?.logo ||
          `https://s2.coinmarketcap.com/static/img/coins/64x64/${tokenData.id}.png`,
        price: tokenData.quote.USD.price,
        marketCap:
          tokenData.quote.USD.market_cap ||
          tokenData.quote.USD.fully_diluted_market_cap,
        fullyDilutedMarketCap:
          tokenData.quote.USD.fully_diluted_market_cap ||
          tokenData.quote.USD.market_cap,
        volume24h: tokenData.quote.USD.volume_24h,
        totalSupply: tokenData.total_supply,
        circulatingSupply: tokenData.circulating_supply,
        maxSupply: null,
        percentChange24h: tokenData.quote.USD.percent_change_24h,
        rank: tokenData.cmc_rank,
        // Required fields from TokenResult interface with default values
        fullyDilutedMarketCap:
          tokenData.quote.USD.fully_diluted_market_cap || 0,
        volumeChange24h: tokenData.quote.USD.volume_change_24h || 0,
        percentChange1h: tokenData.quote.USD.percent_change_1h || 0,
        percentChange7d: tokenData.quote.USD.percent_change_7d || 0,
        percentChange30d: tokenData.quote.USD.percent_change_30d || 0,
        percentChange60d: tokenData.quote.USD.percent_change_60d || 0,
        percentChange90d: tokenData.quote.USD.percent_change_90d || 0,
        circulatingSupplyPercent: 0,
        dominance: 0,
        turnover: 0,
        twitterFollowers: followers,
        redditSubscribers: 0,
        githubCommits: 0,
        githubStars: 0,
        githubContributors: 0,
        liquidityScore: 0,
        volatility24h: 0,
        marketPairs: tokenData.num_market_pairs,
        // Social links
        website: metadata?.urls?.website?.[0] || null,
        twitter: metadata?.urls?.twitter?.[0] || null,
        telegram:
          metadata?.urls?.chat?.find((url) => url.includes("t.me")) || null,
        reddit: metadata?.urls?.reddit?.[0] || null,
        github: metadata?.urls?.source_code?.[0] || null,
        twitterUsername: metadata?.twitter_username || null,
        telegramUsername: null,
        circulatingMarketCap: tokenData.quote.USD.market_cap,
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
