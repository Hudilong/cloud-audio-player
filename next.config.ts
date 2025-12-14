import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

const bucketUrl = process.env.NEXT_PUBLIC_BUCKET_URL;
let bucketRemotePattern: RemotePattern | undefined;

if (bucketUrl) {
  try {
    const parsed = new URL(bucketUrl);
    const protocol = parsed.protocol.replace(':', '');
    if (protocol === 'http' || protocol === 'https') {
      bucketRemotePattern = {
        protocol,
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        pathname: '/**',
      };
    }
  } catch {
    bucketRemotePattern = undefined;
  }
}

const bucketOrigin = (() => {
  if (!bucketUrl) return undefined;
  try {
    const parsed = new URL(bucketUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return undefined;
  }
})();

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://lh3.googleusercontent.com${
    bucketOrigin ? ` ${bucketOrigin}` : ''
  }`,
  `media-src 'self' data: blob:${bucketOrigin ? ` ${bucketOrigin}` : ''}`,
  "font-src 'self' data:",
  `connect-src 'self' https://accounts.google.com https://www.googleapis.com${
    bucketOrigin ? ` ${bucketOrigin}` : ''
  }`,
  "frame-ancestors 'self'",
  "form-action 'self' https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: csp.replace(/\s{2,}/g, ' ').trim(),
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
    remotePatterns: bucketRemotePattern ? [bucketRemotePattern] : [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
