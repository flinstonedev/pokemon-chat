import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'"} https://clerk.com https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.querysculptorchat.com https://challenges.cloudflare.com`,
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: https://img.clerk.com https://images.clerk.dev https://clerk.querysculptorchat.com",
              "connect-src 'self' https://*.convex.cloud https://*.convex.dev https://clerk.com https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.querysculptorchat.com https://clerk-telemetry.com https://agent-query-builder-toolbox.vercel.app wss://*.convex.cloud wss://*.convex.dev https://api.github.com https://raw.githubusercontent.com",
              "frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://clerk.querysculptorchat.com https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
