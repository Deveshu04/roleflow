import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  // Parsers load workers and optional native deps at runtime.
  serverExternalPackages: ["unpdf", "mammoth"],
  // Private runtime data must never be traced into a build.
  outputFileTracingExcludes: { "/*": ["./data/**/*", "./.archive/**/*"] },
  rewrites() {
    // Landing page at /; its fonts use relative URLs.
    return [
      { source: "/", destination: "/landing/index.html" },
      { source: "/inter.woff2", destination: "/landing/inter.woff2" },
      { source: "/instrument-serif-italic.woff2", destination: "/landing/instrument-serif-italic.woff2" },
    ];
  },
};

export default nextConfig;
