import type { Metadata } from "next";
import LegalPage from "../_components/legal-page";
import { PRIVACY } from "../_lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ChadWallet collects, uses, and safeguards your personal data, and the privacy rights you have.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} otherHref="/terms" otherLabel="Terms of Service" />;
}
