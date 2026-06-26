// Feature rows for the zigzag section. Headlines derived from the app's own
// App Store marketing copy (I read every screenshot). Each maps to a cropped
// phone in /public/phones. Strongest content first (primacy).
export type Feature = {
  img: string;
  alt: string;
  label: string;
  title: string;
  body: string;
};

export const ZIGZAG: Feature[] = [
  {
    img: "/phones/token.png",
    alt: "ChadWallet token trading screen with live chart and Buy button",
    label: "Trade",
    title: "Buy any token in one tap",
    body: "Fast trading in seconds. Snipe trending memecoins 24/7 with a live chart, movers, and a one-tap Buy — no slippage math, no twelve confirmations.",
  },
  {
    img: "/phones/discover.png",
    alt: "ChadWallet discover feed showing large trades and top traders",
    label: "Discover",
    title: "Take the guesswork out of trading",
    body: "Watch large trades and top traders move in real time. See exactly what the wallets that are printing are aping into — before it trends.",
  },
  {
    img: "/phones/portfolio.png",
    alt: "ChadWallet portfolio with balance, chart and holdings",
    label: "Portfolio",
    title: "Track your whole bag, live",
    body: "Balance, P&L, holdings, and rewards in one place. Send, receive, deposit, and withdraw — your entire memecoin portfolio at a glance.",
  },
  {
    img: "/phones/kol.png",
    alt: "ChadWallet KOL trader profile with PnL chart and win rate",
    label: "Copy the pros",
    title: "Follow traders who win consistently",
    body: "Real PnL, win rate, and volume on every trader. Follow proven KOLs and grow your profit with confidence instead of guessing.",
  },
];

// Smaller secondary features for the bento grid.
export const BENTO: Feature[] = [
  {
    img: "/phones/launch.png",
    alt: "ChadWallet launch meme coin screen",
    label: "Launch",
    title: "Launch in one tap",
    body: "Turn a meme, a viral tweet, or your own idea into a live coin instantly. Name it, ticker it, ship it — your community is one tap away.",
  },
  {
    img: "/phones/deposit.png",
    alt: "ChadWallet deposit SOL screen via MoonPay",
    label: "Fund",
    title: "Deposit in seconds",
    body: "Top up with MoonPay or SOL in a few taps. You own your crypto — safe, self-custodied, and untouchable.",
  },
  {
    img: "/phones/search.png",
    alt: "ChadWallet token search and explore screen",
    label: "Search",
    title: "Find tokens early",
    body: "Explore New, Trending, Most Traded, and Stocks. Search any token or wallet and get the alpha while it's still early.",
  },
  {
    img: "/phones/x.png",
    alt: "ChadWallet in-app X feed",
    label: "Social",
    title: "Stay in the loop",
    body: "An in-app X feed wired straight to the market — Live, KOLs, Memecoin, and Trending. Stay plugged into the community without leaving the app.",
  },
];
