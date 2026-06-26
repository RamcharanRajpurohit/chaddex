import SiteHeader from "./_components/site-header";
import Hero from "./_components/hero";
import VideoBlock from "./_components/video-block";
import FeatureRows from "./_components/feature-rows";
import Bento from "./_components/bento";
import HowItWorks from "./_components/how-it-works";
import FinalCta from "./_components/final-cta";
import SiteFooter from "./_components/site-footer";
import TokenBanner from "./_components/token-banner";

// Landing page (/). Section order is research-backed (see memory: chadwallet-landing-design):
// hero → trust band → video → zigzag features → bento → how-it-works → final CTA → footer.
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <VideoBlock />
        <FeatureRows />
        <Bento />
        <HowItWorks />
        <FinalCta />
      </main>
      <SiteFooter />
      {/* Live, clickable trending-memecoin ticker pinned to the viewport bottom.
          (Top banner intentionally deferred — component supports it via
          position="top" when added.) */}
      <TokenBanner position="bottom" />
    </>
  );
}
