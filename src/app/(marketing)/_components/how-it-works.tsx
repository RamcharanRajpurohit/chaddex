import { Eyebrow, SectionTitle } from "./section-ui";

// How it works — 3 steps. Removes the "is setup hard?" objection right before
// the final ask. Simple numbered chunks (one idea each).
// Responsive: single column on phones → 3 columns on ≥768px.
const STEPS = [
  {
    n: "1",
    title: "Deposit in seconds",
    body: "Fund your wallet with MoonPay or SOL. You stay in control — your keys, your coins.",
  },
  {
    n: "2",
    title: "Discover a coin",
    body: "Browse trending tokens and copy the trades the top KOLs are making right now.",
  },
  {
    n: "3",
    title: "Trade in one tap",
    body: "Buy and sell any Solana token instantly, 24/7. No slippage math, no friction.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="mx-auto max-w-content scroll-mt-24 px-gutter py-section"
    >
      <div className="mb-14 text-center">
        <Eyebrow>Get started</Eyebrow>
        <SectionTitle>Trading in 60 seconds</SectionTitle>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-green text-lg font-extrabold text-on-green">
              {s.n}
            </div>
            <h3 className="mb-2 mt-5 text-xl font-bold tracking-tight">
              {s.title}
            </h3>
            <p className="text-body text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
