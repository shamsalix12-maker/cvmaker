// ═══════════════════════════════════════════════════════════════
// [F089] src/lib/auth/dev-auth.ts
// Development Authentication Utilities
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types';
import { toast } from 'sonner';
import { DEV_USER_ID_PREFIX } from '@/lib/constants';

/**
 * Checks if a user ID is a mock dev user ID
 */
export function isDevUser(userId: string | null | undefined): boolean {
    if (!userId) return false;
    return userId.startsWith(DEV_USER_ID_PREFIX) || userId.startsWith('dev-user-'); // Keep legacy support for a bit
}
export async function devLogin(email: string, name: string): Promise<User | null> {
    const supabase = createClient();

    try {
        // 1. Check if user exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('Error fetching user:', fetchError);
            throw fetchError;
        }

        let user = existingUser;

        // 2. If not, create user
        if (!existingUser) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([
                    {
                        email,
                        name,
                        preferred_language: 'en', // Default to English
                    }
                ])
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                throw createError;
            }

            user = newUser;
        }

        // 3. Store minimal session info in localStorage for dev purposes
        if (typeof window !== 'undefined') {
            localStorage.setItem('cv_tailor_dev_user_id', user.id);
        }

        // Map database user to application User type
        return {
            id: user.id,
            google_id: user.google_id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            preferred_language: user.preferred_language as 'en' | 'fa',
            created_at: user.created_at,
            updated_at: user.updated_at
        };

    } catch (error) {
        console.error('Dev login failed:', error);
        toast.error('Login failed. Please check console for details.');
        return null;
    }
}

/**
 * Logout function
 */
export function devLogout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('cv_tailor_dev_user_id');
    }
}

/**
 * Get current user from storage and verify with DB
 */
export async function getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;

    const userId = localStorage.getItem('cv_tailor_dev_user_id');
    if (!userId) return null;

    const supabase = createClient();

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            // Invalid session, clear it
            localStorage.removeItem('cv_tailor_dev_user_id');
            return null;
        }

        return {
            id: user.id,
            google_id: user.google_id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            preferred_language: user.preferred_language as 'en' | 'fa',
            created_at: user.created_at,
            updated_at: user.updated_at
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}
