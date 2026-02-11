import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale
});

export default async function middleware(request: NextRequest) {
    // 1. Run intl middleware first to handle redirects/rewrites
    const intlResponse = intlMiddleware(request);

    // 2. Initialize Supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        intlResponse.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // 3. Refresh session
    // This call essentially checks the JWT and if close to expiry, refreshes it.
    // The setAll callback above ensures both the request (for downstream) and response (for browser) are updated.
    await supabase.auth.getUser();

    return intlResponse;
}

export const config = {
    // Match only internationalized pathnames, but exclude API routes and static assets
    matcher: ['/', '/(fa|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
