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

// fomo-style 6-card bento ("never miss out again" — 2×3 grid). Each card maps a
// fomo cell to a ChadWallet trading feature (we skip fomo's social framing). The
// `img` is an in-app screenshot used as the card's visual; copy is ChadWallet's.
export type BentoCard = {
  eyebrow: string;
  title: string;
  img: string;
  alt: string;
};

export const BENTO_GRID: BentoCard[] = [
  {
    eyebrow: "Discover",
    title: "Find the next 100x early",
    img: "/phones/search.png",
    alt: "ChadWallet search and discover screen",
  },
  {
    eyebrow: "Copy the pros",
    title: "Follow traders who win",
    img: "/phones/kol.png",
    alt: "ChadWallet KOL trader profile with PnL",
  },
  {
    eyebrow: "Live feed",
    title: "See what the smart money buys",
    img: "/phones/discover.png",
    alt: "ChadWallet live discover feed",
  },
  {
    eyebrow: "Easy onboarding",
    title: "Create an account in an instant",
    img: "/phones/splash.png",
    alt: "ChadWallet onboarding splash",
  },
  {
    eyebrow: "One wallet",
    title: "Every chain, gasless",
    img: "/phones/portfolio.png",
    alt: "ChadWallet portfolio across chains",
  },
  {
    eyebrow: "One tap to fund",
    title: "Top up with Apple Pay",
    img: "/phones/deposit.png",
    alt: "ChadWallet deposit via MoonPay / Apple Pay",
  },
];
