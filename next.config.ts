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
  async headers() {
    return [
      {
        source: '/preone-mark.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/brand/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
