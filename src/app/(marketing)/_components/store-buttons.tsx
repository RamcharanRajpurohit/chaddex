// Shared App Store + Google Play badge buttons (used in hero and final CTA).
export function StoreButtons({
  appStore,
  googlePlay,
}: {
  appStore: string;
  googlePlay: string;
}) {
  return (
    <>
      <a
        className="btn btn-primary store-btn"
        href={appStore}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download ChadWallet on the App Store"
      >
        <span className="fill" />
        <AppleLogo />
        <span className="store-text">
          <span className="store-top">Download on the</span>
          <span className="store-name">App Store</span>
        </span>
      </a>
      <a
        className="btn store-btn"
        href={googlePlay}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get ChadWallet on Google Play"
      >
        <span className="fill" />
        <GooglePlayLogo />
        <span className="store-text">
          <span className="store-top">Get it on</span>
          <span className="store-name">Google Play</span>
        </span>
      </a>
    </>
  );
}

function AppleLogo() {
  return (
    <svg
      className="store-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.05 12.04c-.03-2.85 2.33-4.22 2.44-4.28-1.33-1.95-3.4-2.22-4.13-2.25-1.76-.18-3.43 1.03-4.32 1.03-.89 0-2.26-1.01-3.72-.98-1.91.03-3.68 1.11-4.66 2.82-1.99 3.45-.51 8.55 1.42 11.35.94 1.37 2.06 2.91 3.53 2.85 1.42-.06 1.95-.92 3.67-.92 1.71 0 2.2.92 3.7.89 1.53-.03 2.5-1.4 3.43-2.78 1.08-1.59 1.53-3.13 1.55-3.21-.03-.02-2.98-1.15-3.01-4.54zM14.2 4.38c.78-.95 1.31-2.27 1.16-3.58-1.13.05-2.49.75-3.3 1.7-.72.84-1.36 2.18-1.19 3.46 1.26.1 2.55-.64 3.33-1.58z" />
    </svg>
  );
}

function GooglePlayLogo() {
  return (
    <svg
      className="store-icon"
      viewBox="0 0 512 512"
      width="20"
      height="20"
      aria-hidden
    >
      <path
        fill="#00D2FF"
        d="M48 28.6C43 32.1 40 39.4 40 49.1v413.8c0 9.7 3 17 8 20.5l1.5.8L281 256.9v-1.8L49.5 27.8z"
      />
      <path
        fill="#FFC400"
        d="M358 333.9 281 256.9v-1.8l77-77.1 1.7 1L451 231c26.1 14.8 26.1 39.1 0 54z"
      />
      <path fill="#FF3D00" d="m359.7 332.9-78.7-78.7L48 487.2c8.6 9.1 22.8 10.2 38.8 1.2z" />
      <path fill="#00E676" d="M48 28.6 281 254.2l78.7-78.7L86.8 23.6C70.8 14.6 56.6 15.6 48 28.6z" />
    </svg>
  );
}
