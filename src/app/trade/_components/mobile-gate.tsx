import Image from "next/image";
import { StoreButtons } from "@/app/(marketing)/_components/store-buttons";
import { LINKS } from "@/app/(marketing)/_lib/links";

// fomo's exact mobile behaviour (verified live): the web terminal is DESKTOP-ONLY.
// Below the lg breakpoint we show the wordmark + "Download the app to start
// trading" + store badges, with a pinned bottom note — and hide the terminal.
export function MobileGate() {
  return (
    <div className="flex min-h-[calc(100vh-84px)] flex-col items-center justify-center px-6 text-center lg:hidden">
      <Image
        src="/logo-mark.png"
        alt="ChadWallet"
        width={72}
        height={72}
        className="mb-5 size-16 [filter:drop-shadow(0_0.25rem_1.25rem_rgba(0,0,0,0.6))]"
        priority
      />
      <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em]">
        Download the app
        <br />
        to start trading
      </h1>
      <div className="cta mt-7 flex-col items-stretch gap-3">
        <StoreButtons appStore={LINKS.appStore} googlePlay={LINKS.googlePlay} />
      </div>

      <div className="fixed inset-x-0 bottom-0 flex items-center justify-center gap-2 border-t border-border bg-card/80 px-4 py-3 text-[13px] text-muted backdrop-blur">
        <DesktopIcon />
        ChadWallet on Web is only available on desktop.
      </div>
    </div>
  );
}

function DesktopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
