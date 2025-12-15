import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  applyRateLimit,
  getClientIp,
  rateLimitHeaders,
} from '@utils/rateLimiter';

const TEN_MINUTES = 10 * 60 * 1000;
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const PUBLIC_PATHS = ['/', '/login', '/register'];

type Rule = {
  key: string;
  limit: number;
  windowMs: number;
  message: string;
  code: string;
  active: boolean;
};

export async function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (isProduction) {
    const proto =
      request.headers.get('x-forwarded-proto') ||
      request.nextUrl.protocol.replace(':', '');
    if (proto === 'http') {
      const url = request.nextUrl.clone();
      url.protocol = 'https:';
      return NextResponse.redirect(url, 308);
    }
  }

  const ip = getClientIp(request);

  const rules: Rule[] = [
    {
      key: `register-ip:${ip}`,
      limit: 5,
      windowMs: FIFTEEN_MINUTES,
      message: 'Too many sign-up attempts. Please try again later.',
      code: 'REGISTER_RATE_LIMIT',
      active: method === 'POST' && pathname === '/api/auth/register',
    },
    {
      key: `auth-ip:${ip}`,
      limit: 20,
      windowMs: TEN_MINUTES,
      message: 'Too many auth attempts. Please slow down.',
      code: 'AUTH_RATE_LIMIT',
      active: method === 'POST' && pathname.startsWith('/api/auth/'),
    },
    {
      key: `upload-ip:${ip}`,
      limit: 40,
      windowMs: FIFTEEN_MINUTES,
      message: 'Upload rate limit exceeded. Please try again soon.',
      code: 'UPLOAD_RATE_LIMIT',
      active: method === 'POST' && pathname === '/api/tracks/upload-url',
    },
    {
      key: `cover-upload-ip:${ip}`,
      limit: 60,
      windowMs: FIFTEEN_MINUTES,
      message: 'Image upload rate limit exceeded. Please try again soon.',
      code: 'COVER_RATE_LIMIT',
      active: method === 'POST' && pathname === '/api/tracks/cover-upload-url',
    },
  ];

  for (const rule of rules) {
    if (!rule.active) continue;
    const result = applyRateLimit(rule.key, rule.limit, rule.windowMs);
    if (!result.allowed) {
      return NextResponse.json(
        { error: rule.message, code: rule.code },
        { status: 429, headers: rateLimitHeaders(result) },
      );
    }
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = '/library';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
