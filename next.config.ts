import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" is only used for self-hosting (Caddy/Docker/bun).
  // On Vercel it conflicts with the adapter-based Turbopack build and causes
  // ENOENT on .next/next-server.js.nft.json (next.js#96657).
  // VERCEL is set to "1" by Vercel during every build.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  ...(process.env.VERCEL === "1" ? {} : { output: "standalone" }),
};

export default nextConfig;
