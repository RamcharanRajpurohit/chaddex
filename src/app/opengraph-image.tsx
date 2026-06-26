import { ImageResponse } from "next/og";

export const alt = "ChadWallet — The #1 Solana memecoin trading app";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded 1200x630 social card, generated at build time. Dark bg + green accent.
// Note: Satori requires every multi-child element to set display: flex.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(ellipse 80% 70% at 50% 40%, #0a1810 0%, #000 70%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#26ed80",
              alignItems: "center",
              justifyContent: "center",
              color: "#04130b",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <span>ChadWallet</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 40,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
          }}
        >
          <span>Outrun the bots.</span>
          <span style={{ color: "#6b7280" }}>Copy the winners.</span>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 30,
            color: "#9aa3b2",
            maxWidth: 820,
          }}
        >
          The #1 Solana memecoin trading app. Snipe early, copy the wallets that
          are printing.
        </div>
      </div>
    ),
    { ...size }
  );
}
