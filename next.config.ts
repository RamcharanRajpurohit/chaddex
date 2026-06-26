import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components = Partial Prerendering by default.
  // Each route serves a static, prefetched shell instantly while dynamic
  // data streams in. Keeps full SSR/SEO — navigation just feels instant.
  cacheComponents: true,
};

export default nextConfig;
