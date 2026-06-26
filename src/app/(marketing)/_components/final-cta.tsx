import Image from "next/image";
import { LINKS } from "../_lib/links";
import { StoreButtons } from "./store-buttons";

// Final CTA = the peak-end. Biggest benefit headline + best screenshot (splash)
// + the app-store badges, glowing. Loss-framed FOMO ("don't miss"). Ends the page
// on the emotional high, not a footer of legal text.
export default function FinalCta() {
  return (
    <section
      id="download"
      className="relative scroll-mt-24 overflow-hidden border-t border-border px-gutter py-section"
    >
      <div className="final-glow" aria-hidden />
      <div className="relative z-[1] mx-auto flex max-w-readable flex-col items-center justify-between gap-12 text-center md:flex-row md:text-left">
        <div>
          <h2 className="text-h1 font-bold">
            Find the next 100x.
            <br />
            <span className="text-dim">Don&apos;t miss the breakout.</span>
          </h2>
          <p className="mx-auto mb-8 mt-5 max-w-copy text-lead text-muted md:mx-0">
            Hunt every memecoin on Solana — live prices, top-trader copy trades,
            one-tap buys. Free, self-custody, ready in 60 seconds.
          </p>
          <div className="cta">
            <StoreButtons appStore={LINKS.appStore} googlePlay={LINKS.googlePlay} />
          </div>
        </div>
        <Image
          src="/phones/splash.png"
          alt="ChadWallet app splash screen"
          width={260}
          height={526}
          className="w-[clamp(11rem,22vw,16rem)] flex-shrink-0 [filter:drop-shadow(0_1.875rem_3.75rem_rgba(0,0,0,0.7))]"
        />
      </div>
    </section>
  );
}
