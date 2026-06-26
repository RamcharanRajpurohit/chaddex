// Official ChadWallet destinations — verified live from chadwallet.xyz page source
// (the site 403s plain fetchers; pulled with a browser User-Agent on 2026-06-22).
export const LINKS = {
  home: "/",
  rewards: "/rewards",
  privacy: "/privacy",
  terms: "/terms",
  x: "https://x.com/intent/follow?screen_name=chadwallet",
  discord: "https://discord.gg/mdCjtyZ8G",
  appStore: "https://apps.apple.com/us/app/chadwallet/id6757367474",
  googlePlay:
    "https://play.google.com/store/apps/details?id=xyz.chadwallet.www",
} as const;
