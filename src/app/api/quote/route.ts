// GET /api/quote?inputMint=&outputMint=&amount=&slippageBps= — Jupiter swap quote
// for the paper-fill preview (no swap is ever executed). Server-proxied so
// identical quotes de-dupe; the client debounces input so we never fetch per
// keystroke. Keyed on the full param tuple; short cacheLife (matches Jupiter's
// max-age=10).

import { cacheLife } from "next/cache";
import { fetchQuote } from "@/lib/terminal/swap-quote";
import { createKeyedFetcher, jsonWithCache } from "@/lib/terminal/route-cache";
import type { SwapQuote } from "@/lib/terminal/types";

const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const get = createKeyedFetcher<SwapQuote | null>({
  label: "quote",
  fetcher: (key) => {
    const [inputMint, outputMint, amount, slippageBps] = key.split("|");
    return fetchQuote({ inputMint, outputMint, amount, slippageBps: Number(slippageBps) });
  },
  isGood: (v) => v !== null,
  empty: () => null,
});

async function getCached(key: string): Promise<SwapQuote | null> {
  "use cache";
  cacheLife({ stale: 10, revalidate: 10, expire: 30 });
  return get(key);
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const inputMint = sp.get("inputMint") ?? "";
  const outputMint = sp.get("outputMint") ?? "";
  const amount = sp.get("amount") ?? "";
  const slippageBps = sp.get("slippageBps") ?? "50";

  if (
    !MINT_RE.test(inputMint) ||
    !MINT_RE.test(outputMint) ||
    !/^\d+$/.test(amount) ||
    amount === "0" ||
    !/^\d+$/.test(slippageBps)
  ) {
    return Response.json({ quote: null });
  }
  return jsonWithCache({ quote: await getCached(`${inputMint}|${outputMint}|${amount}|${slippageBps}`) }, 5, 10);
}
