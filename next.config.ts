import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components stays off: admin and public data are request-time and must
  // never be served from a prerendered/cached shell (see docs/implementation-plan.md).
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
