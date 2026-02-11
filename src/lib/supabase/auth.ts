import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Handles Google OAuth login for the browser
 * @param supabase Supabase client (browser)
 * @param locale Current locale for redirect
 */
export async function signInWithGoogle(supabase: SupabaseClient, locale: string = 'en') {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/${locale}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (error) throw error;
    return data;
}

/**
 * Handles logout
 * @param supabase Supabase client
 */
export async function signOut(supabase: SupabaseClient) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
