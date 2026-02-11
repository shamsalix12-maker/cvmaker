// ═══════════════════════════════════════════════════════════════
// [F063] src/lib/supabase/client.ts
// Supabase Browser Client
// ═══════════════════════════════════════════════════════════════

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export const createBrowserSupabaseClient = createClient;
