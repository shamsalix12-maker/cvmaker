import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale
});

export default async function middleware(request: NextRequest) {
    // 1. Run intl middleware first to handle redirects/rewrites
    const intlResponse = intlMiddleware(request);

    // 2. Refresh Supabase session
    return await updateSession(request, intlResponse);
}

export const config = {
    // Match only internationalized pathnames, but exclude API routes and static assets
    matcher: ['/', '/(fa|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
