"use client";

import { usePrivy } from "@privy-io/react-auth";

// Returns the user's Solana wallet address (base58), or null.
//
// Why not `usePrivy().user.wallet.address`: `user.wallet` is the user's *first
// verified* wallet and is chain-agnostic — for someone who linked an EVM wallet
// first it would be an `0x…` Ethereum address, wrong for a Solana-only app. We
// instead scan `linkedAccounts` for a wallet whose `chainType` is "solana".
//
// Why not `useWallets()` from the /solana entrypoint: that hook reads Solana
// connector context and throws when no <PrivyProvider> is mounted (e.g. during
// static prerender, or when NEXT_PUBLIC_PRIVY_APP_ID is unset). `usePrivy`
// degrades gracefully (returns user: null), so reading off the user object is
// safe everywhere this hook runs.
export function useSolanaAddress(): string | null {
  const { user } = usePrivy();
  const solana = user?.linkedAccounts.find(
    (a) => a.type === "wallet" && a.chainType === "solana",
  );
  return solana && "address" in solana ? solana.address : null;
}
