import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    styledComponents: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/agents/:id',
        destination: '/clawdex/agent/:id',
        permanent: true,
      },
      {
        source: '/agent/:id',
        destination: '/clawdex/agent/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
