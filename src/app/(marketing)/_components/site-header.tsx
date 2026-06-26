"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePrivy, useLogin, useModalStatus } from "@privy-io/react-auth";
import { LINKS } from "../_lib/links";
import { AccountMenu } from "./account-menu";

function LoginButton({
  onClick,
  mobile = false,
}: {
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      className={`login-btn${mobile ? " mobile-login" : ""}`}
      onClick={onClick}
    >
      <LoginIcon />
      Log in
    </button>
  );
}

// Shown while Privy is still rehydrating the session (`!ready`). Privy must do a
// network round-trip to verify the stored session before it knows whether to
// show "Log in" or the account gear, so this slot always resolves a beat after
// the static header. A small neutral dot (gear-sized, NOT a wide login pill)
// keeps the footprint stable so the resolve reads as a quiet fade-in rather than
// a shape-popping "deciding what to render" swap.
function AuthSkeleton({ mobile = false }: { mobile?: boolean }) {
  return (
    <span
      className={`auth-skeleton${mobile ? " mobile-login" : ""}`}
      aria-hidden
    />
  );
}

// Sticky split header. Intentionally minimal (fomo.family pattern): logo left,
// ghosted X + Log in right — NO marketing nav links (Features/How it works are
// redundant with a single-scroll page; Rewards isn't part of this product). On
// login we send the user straight to the trading page. Transparent over the
// hero → frosted-dark + shrink once scrolled; mobile collapses to a hamburger.
//
// `centerSlot` lets the trading terminal inject its search box into the SAME
// header (reuse, not a second header). `solid` (optional) forces the frosted
// state always — unused by the terminal, which keeps the home-page behaviour:
// transparent at the top, frosting only on window scroll.
export default function SiteHeader({
  centerSlot,
  solid = false,
  terminal = false,
}: {
  centerSlot?: React.ReactNode;
  solid?: boolean;
  /** Terminal context: keep a faint bottom hairline always (caps the column
   *  dividers) while staying transparent-at-top like the home page. */
  terminal?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const onTrade = pathname === "/trade";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const { ready, authenticated } = usePrivy();
  const { isOpen: isModalOpen } = useModalStatus();
  // Open Privy's modal. We DON'T redirect from useLogin's onComplete: with
  // embeddedWallets.createOnLogin = "users-without-wallets", onComplete only
  // fires once Privy has finished provisioning the Solana wallet (a 3-4s network
  // step), which made the post-login redirect feel stuck. Instead we arm a flag
  // and redirect the instant `authenticated` flips true (below) — the wallet
  // keeps provisioning in the background and the trade page tolerates a null
  // address until it lands.
  const { login } = useLogin();

  // Redirect to the trading page as soon as auth succeeds for a login we
  // initiated (not on every already-authenticated mount / refresh). Use replace
  // so the back button doesn't return to the marketing page mid-session.
  useEffect(() => {
    if (loggingIn && ready && authenticated) {
      // This setState is coordinated with a navigation side-effect (router.replace)
      // — the "synchronize with an external system" case the rule explicitly
      // allows. Disarm the flag so the redirect fires exactly once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoggingIn(false);
      router.replace("/trade");
    }
  }, [loggingIn, ready, authenticated, router]);

  // Disarm the flag if the user opens the login modal then closes it without
  // authenticating — otherwise it stays primed and a later auth-flip (logging in
  // elsewhere) would trigger a phantom redirect to /trade. `modalWasOpen` guards
  // the race where the modal hasn't rendered open yet on the tick right after
  // startLogin: only treat "modal not open" as a cancel once we've actually seen
  // it open.
  const modalWasOpen = useRef(false);
  useEffect(() => {
    if (!loggingIn) {
      modalWasOpen.current = false;
      return;
    }
    if (isModalOpen) modalWasOpen.current = true;
    else if (modalWasOpen.current && !authenticated) setLoggingIn(false);
  }, [loggingIn, isModalOpen, authenticated]);

  const startLogin = () => {
    setLoggingIn(true);
    login();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`site-header ${scrolled || solid ? "scrolled" : ""} ${terminal ? "site-header--terminal" : ""}`}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <Link href={LINKS.home} className="brand" aria-label="ChadWallet home">
        <Image src="/logo-mark.png" alt="" width={28} height={28} priority />
        <span className="wordmark">ChadWallet</span>
      </Link>

      {/* Trade entry point. On the trade page itself it's the current page, so it
          renders as a non-interactive active marker (aria-current) rather than a
          self-link; everywhere else it routes to /trade. */}
      {onTrade ? (
        <span className="nav-link nav-link--active" aria-current="page">
          Trade
        </span>
      ) : (
        <Link href="/trade" className="nav-link">
          Trade
        </Link>
      )}

      {centerSlot && <div className="header-center">{centerSlot}</div>}

      <div className="header-actions">
        {/* Quick-access store links — get the mobile app in one tap. */}
        <a
          href={LINKS.appStore}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          aria-label="Download ChadWallet on the App Store"
          title="Download on the App Store"
        >
          <AppleIcon />
        </a>
        <a
          href={LINKS.googlePlay}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          aria-label="Get ChadWallet on Google Play"
          title="Get it on Google Play"
        >
          <PlayStoreIcon />
        </a>
        <a
          href={LINKS.x}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          aria-label="Follow ChadWallet on X"
        >
          <XIcon />
        </a>
        {!ready ? (
          <AuthSkeleton />
        ) : (
          <span className="auth-resolved">
            {authenticated ? (
              <AccountMenu />
            ) : (
              <LoginButton onClick={startLogin} />
            )}
          </span>
        )}
        <button
          className="hamburger"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile full-screen overlay menu */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <button
          className="mobile-close"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>
        <div className="mobile-actions">
          {!ready ? (
            <AuthSkeleton mobile />
          ) : (
            <span className="auth-resolved mobile-login">
              {authenticated ? (
                <AccountMenu mobile />
              ) : (
                <LoginButton
                  mobile
                  onClick={() => {
                    setOpen(false);
                    startLogin();
                  }}
                />
              )}
            </span>
          )}
          {/* same-page hash anchor, not a route — plain <a> avoids the router
              prefetch that throws "Failed to fetch" */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/#download"
            className="header-cta mobile-cta"
            onClick={() => setOpen(false)}
          >
            Download the app
          </a>
        </div>
      </div>
    </header>
  );
}

function LoginIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.04c-.03-2.66 2.17-3.94 2.27-4-1.24-1.81-3.17-2.06-3.85-2.09-1.64-.17-3.2.96-4.03.96-.83 0-2.11-.94-3.47-.91-1.79.03-3.44 1.04-4.36 2.64-1.86 3.23-.48 8 1.33 10.62.88 1.28 1.93 2.72 3.31 2.67 1.33-.05 1.83-.86 3.44-.86 1.6 0 2.05.86 3.46.83 1.43-.02 2.34-1.31 3.22-2.6 1.01-1.49 1.43-2.93 1.45-3-.03-.02-2.78-1.07-2.81-4.25M14.4 4.21c.73-.89 1.23-2.12 1.09-3.35-1.06.04-2.34.71-3.1 1.6-.68.78-1.27 2.04-1.11 3.24 1.18.09 2.39-.6 3.12-1.49" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.6 2.3c-.3.2-.5.5-.5 1v17.4c0 .5.2.8.5 1l9.5-9.7-9.5-9.7Zm12.8 5.5L5.4 1.5l9 9.2 2-2.9Zm3.4 2.3-2.4-1.4-2.3 2.3 2.3 2.3 2.4-1.4c.7-.4.7-1.4 0-1.8ZM5.4 22.5l11-6.3-2-2.9-9 9.2Z" />
    </svg>
  );
}
