import type { NextConfig } from 'next';

const backendApiUrl = process.env.BACKEND_API_URL
  || process.env.NEXT_PUBLIC_API_URL
  || 'http://localhost:3001/api/v1';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' }],
  },
  async rewrites() {
    return [{
      source: '/backend-api/:path*',
      destination: `${backendApiUrl}/:path*`,
    }];
  },
};

export default nextConfig;
