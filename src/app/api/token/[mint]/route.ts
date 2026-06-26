// GET /api/token/[mint] — full token detail for the terminal's LEFT column.
// Upstream: Jupiter v2 search?query={mint} (KEYLESS, max-age=10). Revalidate 15s
// ≥ upstream → ~4 upstream calls/min/token max, viewer-count-independent.
//
// Pattern (copied from src/app/api/banner/route.ts and shared by every feed):
//   module-level keyed single-flight + last-known-good → a small `use cache`
//   helper that takes ONLY the serializable mint string (functions can't be
//   captured into a cached scope) → GET awaits params and responds.

import { jsonWithCache } from "@/lib/terminal/route-cache";
import { getTokenDetailCached } from "@/lib/terminal/token-detail-cache";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  return jsonWithCache({ token: await getTokenDetailCached(mint) }, 10, 30);
}
