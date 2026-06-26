// GET /api/search?q=... — free-text token search for the header box. Upstream:
// the SAME Jupiter v2 search (KEYLESS); results are full detail objects so the
// client needs no extra fetch to select one. Keyed by the normalized query so
// repeated searches (everyone typing "bonk") collapse to one upstream call.

import { cacheLife } from "next/cache";
import { searchTokens } from "@/lib/terminal/token-detail";
import { createKeyedFetcher, jsonWithCache } from "@/lib/terminal/route-cache";
import type { TokenDetail } from "@/lib/terminal/types";

const RESULT_LIMIT = 12;

const get = createKeyedFetcher<TokenDetail[]>({
  label: "search",
  fetcher: (q) => searchTokens(q, RESULT_LIMIT),
  isGood: (v) => v.length > 0,
  empty: () => [],
});

async function getCached(query: string): Promise<TokenDetail[]> {
  "use cache";
  cacheLife({ stale: 10, revalidate: 10, expire: 60 });
  return get(query);
}

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 64);
  if (q.length === 0) return Response.json({ tokens: [] });
  return jsonWithCache({ tokens: await getCached(q) }, 10, 30);
}
