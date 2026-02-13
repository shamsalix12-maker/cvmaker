// ═══════════════════════════════════════════════════════════════
// [F064] src/lib/supabase/server.ts
// Supabase Server Client
// ═══════════════════════════════════════════════════════════════

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { isDevUser } from '@/lib/auth/dev-auth';

export async function createServerSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle cookies in read-only context (e.g., Server Components)
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Handle cookies in read-only context
                    }
                },
            },
        }
    );
}

export function createServiceRoleClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) { return ''; },
                set(name: string, value: string, options: CookieOptions) { },
                remove(name: string, options: CookieOptions) { },
            },
        }
    );
}

/**
 * Gets the current user ID, checking both Supabase session and development fallback headers.
 */
export async function getServerUserId() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user.id;

    try {
        const headersList = await headers();
        const devUserId = headersList.get('x-user-id');
        if (isDevUser(devUserId)) return devUserId as string;
    } catch (e) {
        // Headers might not be available in some contexts
    }

    return null;
}
