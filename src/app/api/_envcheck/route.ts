// TEMPORARY diagnostic — reports whether server-only env vars are visible at
// runtime on Vercel (without leaking their values). DELETE after debugging.
export const dynamic = "force-dynamic";

export async function GET() {
  const alchemy = process.env.ALCHEMY_RPC_URL;
  return Response.json({
    ALCHEMY_RPC_URL_present: Boolean(alchemy),
    ALCHEMY_RPC_URL_length: alchemy?.length ?? 0,
    ALCHEMY_host: alchemy ? new URL(alchemy).host : null,
    NEXT_PUBLIC_PRIVY_APP_ID_present: Boolean(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    ),
    node_env: process.env.NODE_ENV,
  });
}
