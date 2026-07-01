import SiteHeader from "./_components/site-header";
import Hero from "./_components/hero";
import TerminalShowcase from "./_components/terminal-showcase";
import Bento from "./_components/bento";
import FinalCta from "./_components/final-cta";
import SiteFooter from "./_components/site-footer";
import TokenBanner from "./_components/token-banner";

// Landing page (/). Mirrors fomo.family's section flow, ChadWallet-skinned:
// hero → "trade from anywhere" (desktop+phone terminal mockup) → feature
// coverflow carousel → final CTA (peak-end "find the next 100x") → footer.
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <TerminalShowcase />
        <Bento />
        <FinalCta />
      </main>
      <SiteFooter />
      {/* Live, clickable trending-memecoin ticker pinned to the viewport bottom. */}
      <TokenBanner position="bottom" />
    </>
  );
}
