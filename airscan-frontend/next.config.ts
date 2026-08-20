import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin pulls in jwks-rsa -> jose's ESM-only webapi build, which the
  // bundler mishandles if it tries to bundle it into the server chunk (ERR_REQUIRE_ESM
  // at runtime). Keep it external so Node resolves it directly from node_modules instead.
  serverExternalPackages: ['firebase-admin'],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
