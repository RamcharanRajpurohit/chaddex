# ChadWallet — Solana Memecoin Trading Wallet

A fomo.family-style landing page **plus a full trading terminal** for ChadWallet,
a Solana memecoin wallet. Built for the Founding Engineer take-home: real on-chain
data, Privy auth with an embedded Solana wallet, and a 3-column trading UI.

**Live demo:** _add your Vercel URL here_

## Features

### Landing
- fomo-style hero, feature sections, legal pages (Privacy / Terms)
- **Rotating token banners** (top + bottom) — tap a token to open it in the terminal
- Sign in with **Google** via **Privy** (embedded Solana wallet auto-created on login)
- Account menu: live SOL balance, copy address, log out

### Trading terminal (`/trade`)
Three-column [ape.pro](https://ape.pro)-style layout, powered by **real data**:
- **Left** — trending tokens rail + token detail / safety info
- **Middle** — price chart (TradingView Advanced widget with a custom-resolved
  symbol, plus a lightweight candlestick fallback) · holders list · live trades
- **Right** — buy / sell panel with a live Jupiter quote + the user's position
- **PaperSOL model** — real prices, simulated fills (fee + slippage), virtual
  balance. No on-chain swaps, so the demo is safe to try with no real funds.

## Data sources

All third-party calls are proxied through server-side `/api/*` routes so keys
never reach the browser, with short-TTL caching to stay within free-tier limits.

| Route | Source | Purpose |
|-------|--------|---------|
| `/api/banner` | Jupiter Tokens v2 (keyless) | trending tokens for the banners |
| `/api/search` · `/api/token` · `/api/quote` | Jupiter | search, token info, swap quote |
| `/api/ohlcv` · `/api/trades` | GeckoTerminal (keyless) | candles + live trades |
| `/api/holders` | Alchemy RPC + GeckoTerminal | top holders |
| `/api/tv-symbol` | TradingView symbol search | resolve the best TV symbol |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Privy (auth + embedded
Solana wallet) · Jupiter · GeckoTerminal · Alchemy RPC · TradingView · Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

### Environment

| Var | Required | Notes |
|-----|----------|-------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | yes | from [dashboard.privy.io](https://dashboard.privy.io); public client id |
| `ALCHEMY_RPC_URL` | optional | server-only Solana RPC for the holders list; falls back to the public RPC if unset |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | optional | client RPC for balances; defaults to public mainnet |

In the Privy dashboard, enable **Google** login and **Solana** embedded wallets,
and add your dev/prod domains to the allowed origins.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run lint     # eslint
```
