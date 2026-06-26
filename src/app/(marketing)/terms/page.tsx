import type { Metadata } from "next";
import LegalPage from "../_components/legal-page";
import { TERMS } from "../_lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your access to and use of ChadWallet, including eligibility, risks, and dispute resolution.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} otherHref="/privacy" otherLabel="Privacy Policy" />;
}
