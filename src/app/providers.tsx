"use client";

// Client-only Privy provider. Per Privy's Next.js App Router guidance, the raw
// <PrivyProvider> must never render server-side — so it lives behind this
// "use client" wrapper that RootLayout mounts. Gate UI on `ready` from
// usePrivy() before reading auth state to avoid hydration flicker.
//
// Config notes (verified against @privy-io/react-auth v3):
// - We use Privy's PREBUILT modal (opened via useLogin().login()), branded to
//   ChadWallet through `appearance` below. This is how the real chadwallet.xyz
//   works, and it lets Privy auto-create the Solana wallet on login — so no
//   custom wallet-creation code is needed.
// - Solana-only app → walletChainType "solana-only", embeddedWallets.solana.
// - createOnLogin "users-without-wallets": users who sign in get a Privy-custodied
//   Solana wallet automatically (this fires for the prebuilt modal path).
// - appId is a PUBLIC identifier; real security is the domain allowlist in the
//   Privy dashboard, not secrecy of this value.

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

const solanaConnectors = toSolanaWalletConnectors();

export default function Providers({ children }: { children: React.ReactNode }) {
  // If the App ID isn't set yet (e.g. fresh clone before .env.local is filled),
  // render children without Privy so the marketing site still works. Auth
  // buttons surface a clear "not configured" state instead of a white screen.
  if (!APP_ID) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[Privy] NEXT_PUBLIC_PRIVY_APP_ID is not set — auth is disabled. " +
          "Add it to .env.local (see .env.example).",
      );
    }
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        // Social/web2 first; external wallet last.
        loginMethods: ["google", "email", "wallet"],
        appearance: {
          // theme accepts a hex (not just "dark") — pass our exact page black so
          // every Privy modal (login, export wallet, …) tints to our background
          // instead of Privy's generic navy-dark. This is the only lever Privy
          // exposes to match their modals to our look; borderRadius/glass/fonts
          // are not configurable on Privy-rendered modals.
          theme: "#000000",
          accentColor: "#26ED80", // ChadWallet primary green (buttons, accents)
          logo: "/logo-mark.png",
          landingHeader: "Log in or sign up",
          loginMessage: "Trade memecoins in seconds.",
          walletChainType: "solana-only",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
        },
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
        // Terms & Privacy links in the modal footer ("By logging in I agree…").
        legal: {
          termsAndConditionsUrl: "/terms",
          privacyPolicyUrl: "/privacy",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
