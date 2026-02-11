import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isDevUser } from './dev-auth';

/**
 * Resolves the user ID from either Supabase Auth or Dev Auth headers.
 * Use this in all API routes to ensure consistent authentication handling.
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Try real Supabase user
    let userId = user?.id;

    // 2. Try Dev Auth (via x-user-id header)
    if (!userId) {
        const devUserId = request.headers.get('x-user-id');
        if (isDevUser(devUserId)) {
            userId = devUserId as string;
        }
    }

    return userId || null;
}
