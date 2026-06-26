import Link from "next/link";
import SiteHeader from "./site-header";
import SiteFooter from "./site-footer";
import { LINKS } from "../_lib/links";
import {
  LEGAL_CONTACT_EMAIL,
  type LegalBlock,
  type LegalDoc,
} from "../_lib/legal";

// Shared renderer for the /privacy and /terms pages.
// Clean & simple, on-brand: narrow readable column (max-w-3xl), generous
// line-height, numbered sections, brand-green accents. Styled purely with
// Tailwind tokens that resolve to the brand CSS vars (see globals.css @theme),
// so re-theming the site re-skins these pages too — no hardcoded colors here.

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="mt-4 text-[15px] leading-[1.75] text-muted first:mt-0">
          {block.text}
        </p>
      );
    case "sub":
      return (
        <h3 className="mt-7 text-[17px] font-semibold tracking-tight text-white">
          {block.text}
        </h3>
      );
    case "list":
      return (
        <ul className="mt-4 flex flex-col gap-2.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="relative pl-5 text-[15px] leading-[1.7] text-muted before:absolute before:left-0 before:top-[0.65em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-green"
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "terms":
      return (
        <dl className="mt-4 flex flex-col gap-3">
          {block.items.map((row, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface px-4 py-3"
            >
              <dt className="text-[15px] font-semibold text-white">
                {row.term}
              </dt>
              <dd className="mt-1 text-[14.5px] leading-[1.65] text-muted">
                {row.def}
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

export default function LegalPage({
  doc,
  otherHref,
  otherLabel,
}: {
  doc: LegalDoc;
  otherHref: string;
  otherLabel: string;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="bg-bg">
        {/* Header band with the doc title + the plain-language "gist" callout */}
        <header className="border-b border-border px-5 pb-12 pt-32 sm:pt-36">
          <div className="mx-auto max-w-3xl">
            <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-green">
              ChadWallet · Legal
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {doc.title}
            </h1>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[13px] text-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              {doc.effective}
            </p>

            {/* "The gist" — clearly labelled as our plain-English summary, not
                a substitute for the binding text below. */}
            <div className="mt-7 rounded-2xl border border-border bg-surface p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-green">
                The gist
              </p>
              <p className="mt-2 text-[15px] leading-[1.7] text-muted">
                {doc.intro}
              </p>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="px-5 py-12">
          <article className="mx-auto max-w-3xl">
            {doc.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 border-t border-border py-9 first:border-t-0 first:pt-0"
              >
                <h2 className="flex items-baseline gap-3 text-[22px] font-bold tracking-tight text-white">
                  <span className="shrink-0 text-green">{section.num}.</span>
                  <span>{section.title}</span>
                </h2>
                <div className="mt-3">
                  {section.blocks.map((block, i) => (
                    <Block key={i} block={block} />
                  ))}
                </div>
              </section>
            ))}

            {/* Cross-link to the companion doc */}
            <div className="mt-10 border-t border-border pt-8 text-[15px] text-muted">
              Looking for the{" "}
              <Link
                href={otherHref}
                className="font-medium text-green underline-offset-4 hover:underline"
              >
                {otherLabel}
              </Link>
              ?
            </div>

            {/* Closing contact card — peak-end reassurance instead of trailing off */}
            <div className="mt-6 rounded-2xl border border-border bg-surface p-6 text-center">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Questions?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-[1.7] text-muted">
                Reach the team and we&apos;ll get back to you.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                  className="inline-flex items-center rounded-full bg-green px-5 py-2.5 text-[15px] font-bold text-on-green transition hover:brightness-105"
                >
                  {LEGAL_CONTACT_EMAIL}
                </a>
                <a
                  href={LINKS.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-border-strong bg-surface-2 px-5 py-2.5 text-[15px] font-semibold text-white transition hover:border-green/60"
                >
                  Discord
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
