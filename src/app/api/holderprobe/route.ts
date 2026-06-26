// TEMP probe — calls fetchTopWallets DIRECTLY (it throws, unlike the route's
// swallowing path) to surface the REAL Vercel error for a given mint.
// GET /api/holderprobe?mint=<mint>. DELETE after debugging.
export const dynamic = "force-dynamic";

import { fetchTopWallets } from "@/lib/terminal/holders";

export async function GET(req: Request) {
  const mint =
    new URL(req.url).searchParams.get("mint") ??
    "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump";
  try {
    const wallets = await fetchTopWallets(mint);
    return Response.json({ ok: true, mint, count: wallets.length, first: wallets[0] ?? null });
  } catch (err) {
    return Response.json({
      ok: false,
      mint,
      errorName: err instanceof Error ? err.constructor.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack?.slice(0, 800) : null,
    });
  }
}
