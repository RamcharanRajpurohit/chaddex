"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaAddress } from "@/lib/use-solana-address";
import { useSolBalance } from "@/lib/use-sol-balance";

// Authenticated account control: a gear button that toggles a dropdown card
// with the full address (click-to-copy), live SOL balance, and log out.
// Shared by the desktop header and the mobile overlay.
export function AccountMenu({ mobile = false }: { mobile?: boolean }) {
  const { user, logout } = usePrivy();
  const address = useSolanaAddress();
  const balance = useSolBalance(address);

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside-click and Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      ref={ref}
      className={`relative inline-flex ${mobile ? "justify-center" : ""}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
        className="inline-flex text-muted transition-colors hover:text-white aria-expanded:text-white"
      >
        <GearIcon />
      </button>

      {open && (
        // Pure-black glassy card with a neutral white INSET edge ring
        // (`account-glow`) that breathes inside the border — contained, no
        // colour wash. Monochrome; no green on the card. See globals.css.
        <div
          role="menu"
          className={`account-glow absolute top-[calc(100%+10px)] z-[200] w-[290px] rounded-3xl border border-white/[0.08] bg-black/90 p-3 backdrop-blur-2xl
            ${mobile ? "left-1/2 -translate-x-1/2" : "right-0"}`}
        >
          <div>
            {address && (
              <>
                {/* Balance + address hero — frosted glass panel. The strong
                    top→bottom white gradient + bright top highlight reads as
                    glass even on a dark page (where there's little behind it to
                    blur). */}
                <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Balance
                  </div>
                  <div className="mt-1.5 text-[30px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-white">
                    {balance === null ? "0.000" : balance.toFixed(3)}
                    <span className="ml-1.5 text-[16px] font-bold text-white/60">
                      SOL
                    </span>
                  </div>

                  <button
                    onClick={copyAddress}
                    title="Copy address"
                    className="mt-3.5 flex w-full items-center gap-2 rounded-xl border border-white/[0.07] bg-black/40 px-3 py-2.5 transition-colors hover:border-white/25"
                  >
                    <span className="min-w-0 flex-1 truncate text-left font-mono text-[12px] text-slate-400">
                      {address}
                    </span>
                    <span className="flex-none whitespace-nowrap text-[11.5px] font-bold text-white">
                      {copied ? "Copied ✓" : "Copy"}
                    </span>
                  </button>
                </div>

                {/* Actions */}
                <div className="mt-2 flex flex-col gap-0.5">
                  <button
                    role="menuitem"
                    onClick={() => logout()}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium text-slate-200 transition-colors hover:bg-red/10 hover:text-[#f87171]"
                  >
                    <LogoutIcon />
                    Log out
                  </button>
                </div>
              </>
            )}

            {user?.email?.address && (
              <div className="mt-2 truncate border-t border-white/[0.05] px-1 pt-2.5 text-[11px] text-white/30">
                {user.email.address}
              </div>
            )}

            {/* When there's no wallet yet, still allow logout */}
            {!address && (
              <button
                role="menuitem"
                onClick={() => logout()}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium text-slate-200 transition-colors hover:bg-red/10 hover:text-[#f87171]"
              >
                <LogoutIcon />
                Log out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="flex-none opacity-70">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
