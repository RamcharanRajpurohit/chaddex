import type { Metadata } from "next";
import { TradeTerminal } from "./_components/trade-terminal";

export const metadata: Metadata = {
  title: "Trade",
  robots: { index: false, follow: false }, // app surface, not a marketing page
};

// The ape.pro-style 3-column trading terminal: trending list + token detail
// (left), chart + trades + holders (middle), buy/sell + position (right). Powered
// by keyless live data (Jupiter v2, GeckoTerminal) with paper-trade fills.
export default function TradePage() {
  return <TradeTerminal />;
}
