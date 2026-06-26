import type { Metadata } from "next";
import SiteHeader from "../_components/site-header";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Earn $CHAD points on every fill — get rewarded to ape.",
};

export default function RewardsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Earn <span style={{ color: "var(--green)" }}>$CHAD</span> on every fill
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Get rewarded to ape. Rewards program details are coming soon.
        </p>
      </main>
    </>
  );
}
