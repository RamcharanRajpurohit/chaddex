import Image from "next/image";
import Link from "next/link";
import { LINKS } from "../_lib/links";

// Minimal, grouped footer (research-backed for a single-product site — a fat
// 4-column footer would over-structure a thin site and fight the fomo-style
// minimalism). Three concerns kept visually distinct: brand + the one product
// link (Rewards) · social ICONS (crypto convention) · legal beside copyright.
// Extra bottom padding so the fixed ticker bar never covers the legal line.
//
// Copyright year is a static constant: Next 16 (Cache Components) forbids
// reading `new Date()` during static prerender of a Server Component, and a
// copyright year doesn't need per-request freshness. Bump on each new year.
const YEAR = 2026;

// `noBorder` drops the top hairline (the terminal page already has the rounded
// card above, so the footer border there would be a redundant double line).
export default function SiteFooter({ noBorder = false }: { noBorder?: boolean }) {
  return (
    <footer className={`px-6 pb-[88px] pt-14 ${noBorder ? "" : "border-t border-border"}`}>
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-start justify-between gap-10">
        {/* Brand + product link */}
        <div className="flex max-w-[360px] flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-mark.png" alt="ChadWallet" width={32} height={32} />
            <span className="text-[18px] font-bold">ChadWallet</span>
          </div>
          <p className="text-[14px] leading-[1.6] text-muted">
            Hunt every memecoin. Every chain. One wallet.
          </p>
          <Link
            href={LINKS.rewards}
            className="mt-1 w-fit text-[15px] text-muted transition-colors hover:text-green"
          >
            Rewards
          </Link>
        </div>

        {/* Social icons (≥44px hit area, aria-labelled) */}
        <div className="flex items-center gap-3">
          <a
            href={LINKS.x}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ChadWallet on X"
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:text-green"
          >
            <XIcon />
          </a>
          <a
            href={LINKS.discord}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ChadWallet on Discord"
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:text-green"
          >
            <DiscordIcon />
          </a>
        </div>
      </div>

      {/* Legal baseline: copyright + disclaimer left, Privacy/Terms right */}
      <div className="mx-auto mt-10 flex max-w-[1100px] flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-surface-2 pt-6 text-[13px] text-dim">
        <span>
          © {YEAR} ChadWallet · Not financial advice. Trade responsibly.
        </span>
        <nav className="flex items-center gap-5">
          <Link href={LINKS.privacy} className="transition-colors hover:text-muted">
            Privacy
          </Link>
          <Link href={LINKS.terms} className="transition-colors hover:text-muted">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}
