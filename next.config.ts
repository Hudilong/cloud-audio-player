import type { NextConfig } from 'next';

const bucketUrl = process.env.NEXT_PUBLIC_BUCKET_URL;
let bucketRemotePattern;

if (bucketUrl) {
  try {
    const parsed = new URL(bucketUrl);
    bucketRemotePattern = {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: '/**',
    };
  } catch {
    bucketRemotePattern = undefined;
  }
}

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
    remotePatterns: bucketRemotePattern ? [bucketRemotePattern] : [],
  },
};

export default nextConfig;
