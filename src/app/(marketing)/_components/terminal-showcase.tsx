import Image from "next/image";
import { Eyebrow } from "./section-ui";

// fomo's "trade from anywhere. never lose a beat." section: an eyebrow pill, a
// two-line headline + sub, then a desktop screen (on a stand) with a phone
// overlapping its lower-right — the cross-device pitch. We show ChadWallet's OWN
// /trade terminal in the desktop and a real app screen in the phone.
export default function TerminalShowcase() {
  return (
    <section className="mx-auto max-w-content px-gutter py-section text-center">
      <Eyebrow>Now available on web</Eyebrow>
      <h2 className="mt-3 text-h2 font-bold leading-[1.04]">
        Trade from anywhere.
        <br />
        Never lose a beat.
      </h2>
      <p className="mx-auto mt-4 max-w-copy text-lead text-muted">
        Open a trade on your phone, close it on your desktop — one wallet,
        every screen.
      </p>

      {/* device cluster: desktop screen + overlapping phone */}
      <div className="device-cluster">
        <div className="device-desktop">
          <div className="device-desktop-screen">
            <Image
              src="/terminal-shot-v3.png"
              alt="ChadWallet trading terminal on desktop — live chart, trending tokens, and a buy/sell panel"
              width={1600}
              height={1000}
              className="block size-full object-cover object-top"
              sizes="(max-width: 900px) 100vw, 60rem"
            />
          </div>
          <span className="device-desktop-stand" aria-hidden />
          <span className="device-desktop-foot" aria-hidden />
        </div>

        <div className="device-phone">
          <Image
            src="/phones/portfolio.png"
            alt="ChadWallet portfolio on mobile"
            width={320}
            height={650}
            className="block size-full rounded-[1.6rem] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
