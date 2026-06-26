import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  // metadataBase makes all relative OG/Twitter image + canonical URLs absolute.
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: "%s · ChadWallet",
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.founder }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  keywords: [
    "ChadWallet",
    "Solana wallet",
    "memecoin trading app",
    "meme coin trading",
    "Solana trading app",
    "copy trading crypto",
    "social trading crypto",
    "memecoin sniper",
    "crypto portfolio tracker",
    "buy Solana tokens",
    "self-custody wallet",
  ],
  category: "finance",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      {
        url: "/icon-light.png",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark.png",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
    // opengraph-image.tsx generates the image; Next injects og:image here.
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    creator: SITE.twitter,
    title: SITE.title,
    description: SITE.description,
  },
  appLinks: {
    ios: {
      url: SITE.appStore,
      app_store_id: SITE.appStoreId,
      app_name: SITE.name,
    },
    android: {
      url: SITE.googlePlay,
      package: SITE.androidPackage,
      app_name: SITE.name,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Structured data: Organization + the app (SoftwareApplication) + WebSite.
// Helps Google/AI understand the brand, app, and search box.
function jsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        legalName: SITE.legalName,
        url: SITE.url,
        logo: `${SITE.url}/icon-light.png`,
        foundingDate: SITE.foundingYear,
        founder: { "@type": "Person", name: SITE.founder },
        sameAs: SITE.sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "MobileApplication",
        name: SITE.name,
        operatingSystem: "iOS, Android",
        applicationCategory: "FinanceApplication",
        description: SITE.description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": `${SITE.url}/#organization` },
        downloadUrl: [SITE.appStore, SITE.googlePlay],
      },
    ],
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script
          type="application/ld+json"
          // sanitize < to prevent XSS, per Next.js JSON-LD guidance
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd()).replace(/</g, "\\u003c"),
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
