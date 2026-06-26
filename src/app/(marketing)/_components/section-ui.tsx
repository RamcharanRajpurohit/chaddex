import type { ReactNode } from "react";

// Shared section typography. Uses the FLUID type tokens from globals.css
// (@theme) — text-eyebrow / text-h2 / text-lead all clamp() between phone and
// desktop, so there are no hardcoded px and the scale lives in one place.

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="block text-eyebrow font-semibold uppercase tracking-[0.12em] text-green">
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={`mt-3 text-h2 font-bold ${className}`}>{children}</h2>;
}

export function SectionSub({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`mt-4 max-w-copy text-lead text-muted ${className}`}>
      {children}
    </p>
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-green">{children}</span>;
}
