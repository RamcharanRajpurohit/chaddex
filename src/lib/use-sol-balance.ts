"use client";

import { useEffect, useState } from "react";

// Default to Solana's public mainnet RPC (rate-limited but key-less). Swap for
// Alchemy/Helius in production via NEXT_PUBLIC_SOLANA_RPC_URL.
const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const LAMPORTS_PER_SOL = 1_000_000_000;

// Fetches a Solana address's SOL balance via the JSON-RPC `getBalance` method.
// Returns null while loading or on error. Re-fetches when the address changes.
export function useSolBalance(address: string | null): number | null {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const lamports = data?.result?.value;
        if (!cancelled && typeof lamports === "number") {
          setBalance(lamports / LAMPORTS_PER_SOL);
        }
      })
      .catch(() => {
        if (!cancelled) setBalance(null);
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  // Guard the returned value so a stale balance never shows for a missing address.
  return address ? balance : null;
}
