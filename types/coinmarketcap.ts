export interface CoinMarketCapToken {
  id: number;
  name: string;
  symbol: string;
  cmc_rank: number;
  num_market_pairs: number;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      market_cap: number;
      fully_diluted_market_cap: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      percent_change_60d: number;
      percent_change_90d: number;
    };
  };
}
