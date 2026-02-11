import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/dashboard';

    if (code) {
        const supabase = await createServerSupabaseClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Get locale from the URL (path parameter)
    const localeMatch = requestUrl.pathname.match(/^\/([^\/]+)\/auth\/callback/);
    const locale = localeMatch ? localeMatch[1] : 'en';

    // Ensure 'next' path has the locale prefix if it's not already internationalized
    let redirectPath = next;
    if (!redirectPath.startsWith(`/${locale}`)) {
        redirectPath = `/${locale}${redirectPath.startsWith('/') ? '' : '/'}${redirectPath}`;
    }

    return NextResponse.redirect(`${requestUrl.origin}${redirectPath}`);
}
