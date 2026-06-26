// TEMPORARY — surfaces the REAL error from the Alchemy top-wallets path on
// Vercel (the holders route swallows it into []). DELETE after debugging.
export const dynamic = "force-dynamic";

import { createSolanaRpc, address } from "@solana/kit";

export async function GET() {
  const mint = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"; // BONK
  const url = process.env.ALCHEMY_RPC_URL;
  const out: Record<string, unknown> = {
    hasUrl: Boolean(url),
    urlHost: url ? new URL(url).host : null,
  };
  try {
    const rpc = createSolanaRpc(url!);
    const [largest, supply] = await Promise.all([
      rpc.getTokenLargestAccounts(address(mint)).send(),
      rpc.getTokenSupply(address(mint)).send(),
    ]);
    out.largestCount = largest.value.length;
    out.supplyAmount = String(supply.value.amount);
    out.firstAcct = largest.value[0]
      ? { address: largest.value[0].address, amount: String(largest.value[0].amount) }
      : null;
    out.ok = true;
  } catch (err) {
    out.ok = false;
    out.errorName = err instanceof Error ? err.constructor.name : typeof err;
    out.errorMessage = err instanceof Error ? err.message : String(err);
    out.errorStack = err instanceof Error ? err.stack?.slice(0, 600) : null;
  }
  return Response.json(out);
}
