import Image from "next/image";
import FireflyScene from "./firefly-scene";
import { StoreButtons } from "./store-buttons";
import { LINKS } from "../_lib/links";

// ChadWallet landing hero — ported from chadwallet-hero.html (see REFERENCE.md).
// Server component; only the firefly canvas is a client island.
export default function Hero() {
  return (
    <section className="hero">
      <FireflyScene />
      <div className="scrim" />
      <div className="vignette" />

      <div className="relative z-[2] max-w-3xl px-gutter">
        <Image
          className="mx-auto mb-5 block size-16 sm:size-[4.5rem] [filter:drop-shadow(0_0.25rem_1.25rem_rgba(0,0,0,0.6))]"
          src="/logo-mark.png"
          alt="ChadWallet"
          width={72}
          height={72}
          priority
        />

        <span className="mb-5 inline-block text-eyebrow font-semibold uppercase tracking-[0.14em] text-muted">
          <b className="font-bold text-green">Every chain</b> · One wallet
        </span>

        <h1 className="text-display font-bold whitespace-nowrap">
          Outrun the bots.
          <br />
          <span className="text-dim">Print like a chad.</span>
        </h1>

        <div className="cta">
          <StoreButtons appStore={LINKS.appStore} googlePlay={LINKS.googlePlay} />
        </div>
      </div>
    </section>
  );
}
