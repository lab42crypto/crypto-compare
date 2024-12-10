export interface TokenResult {
  id: number;
  name: string;
  symbol: string;
  logo: string;
  rank: number;
  price: number;
  marketCap: number;
  fullyDilutedMarketCap: number;
  volume24h: number;
  volumeChange24h: number;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  percentChange30d: number;
  percentChange60d: number;
  percentChange90d: number;
  totalSupply: number;
  circulatingSupply: number;
  maxSupply: number | null;
  circulatingSupplyPercent: number;
  dominance: number;
  turnover: number;
  twitterFollowers: number;
  twitterSuspended: boolean;
  redditSubscribers: number;
  githubCommits: number;
  githubStars: number;
  githubContributors: number;
  liquidityScore: number;
  volatility24h: number;
  marketPairs: number;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  reddit: string | null;
  github: string | null;
  twitterUsername: string | null;
  telegramUsername: string | null;
  circulatingMarketCap: number;
}

export interface SearchToken {
  id: number;
  name: string;
  symbol: string;
  logo: string;
}
