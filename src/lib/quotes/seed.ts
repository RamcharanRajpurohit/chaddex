import type { Token } from "./types";

// Seed data: a small set of well-known, long-lived Solana memecoin mints with
// plausible static values. Two jobs:
//   1. First paint / SSR shell — the banner is NEVER empty, even before the first
//      live fetch lands.
//   2. Last-known-good fallback — if the upstream is down on the very first call
//      (so we have no cached live data yet), the route serves this instead of an
//      empty bar.
//
// Prices/changes here are intentionally static and approximate — they are only a
// placeholder until live data replaces them within the first poll. Mints are real
// and verified (so the click-through to /token/[mint] works even on seed data).
export const SEED_TOKENS: Token[] = [
  { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK", name: "Bonk", price: 0.0000179, change24h: 2.4, direction: "up", logoURI: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I" },
  { mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", symbol: "WIF", name: "dogwifhat", price: 0.78, change24h: -3.1, direction: "down", logoURI: "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link" },
  { mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", symbol: "JUP", name: "Jupiter", price: 0.22, change24h: 2.7, direction: "up", logoURI: "https://static.jup.ag/jup/icon.png" },
  { mint: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump", symbol: "Fartcoin", name: "Fartcoin", price: 0.12, change24h: -6.8, direction: "down" },
  { mint: "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn", symbol: "PUMP", name: "Pump", price: 0.00125, change24h: -10.0, direction: "down" },
  { mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", symbol: "POPCAT", name: "Popcat", price: 0.31, change24h: 5.2, direction: "up" },
];
