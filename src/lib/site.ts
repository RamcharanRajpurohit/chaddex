// Canonical site facts — verified from the App Store / Play Store / F4 Fund.
// Used across metadata, JSON-LD, sitemap, robots, manifest.
export const SITE = {
  name: "ChadWallet",
  // Legal entity (Apple "Seller"): CHAD WALLET L.L.C.
  legalName: "Chad Wallet L.L.C.",
  // Official contact (from chadwallet.gitbook.io; the live site obfuscates it).
  contactEmail: "hello@chadwallet.xyz",
  founder: "Pengcheng Chen",
  foundingYear: "2025",
  // The live marketing site. Our deploy can override via NEXT_PUBLIC_SITE_URL.
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.chadwallet.xyz",
  title: "ChadWallet | Solana Memecoin Trading Wallet",
  description:
    "Discover, track, buy, and trade Solana memecoins in seconds. Snipe early, copy the wallets that are actually printing, and never miss the next 100x — all in one fast, social-first wallet.",
  themeColor: "#080404",
  twitter: "@chadwallet",
  appStore: "https://apps.apple.com/us/app/chadwallet/id6757367474",
  appStoreId: "6757367474",
  googlePlay:
    "https://play.google.com/store/apps/details?id=xyz.chadwallet.www",
  androidPackage: "xyz.chadwallet.www",
  sameAs: [
    "https://x.com/chadwallet",
    "https://www.linkedin.com/company/chadwallet",
    "https://apps.apple.com/us/app/chadwallet/id6757367474",
    "https://play.google.com/store/apps/details?id=xyz.chadwallet.www",
  ],
} as const;
