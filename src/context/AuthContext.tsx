// ═══════════════════════════════════════════════════════════════
// [F090] src/context/AuthContext.tsx
// Authentication Context
// ═══════════════════════════════════════════════════════════════

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { devLogin, devLogout, getCurrentUser } from '@/lib/auth/dev-auth';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { DEV_USER_ID_PREFIX } from '@/lib/constants';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, name: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const headers_locale = useLocale();
    const t = useTranslations('auth');
    const supabase = createBrowserSupabaseClient();

    // Mapping Supabase User to App User
    const mapSupabaseUser = (su: any): User => ({
        id: su.id,
        google_id: su.app_metadata?.provider === 'google' ? su.user_metadata?.sub : null,
        email: su.email || '',
        name: su.user_metadata?.full_name || su.user_metadata?.name || su.email?.split('@')[0] || 'User',
        avatar_url: su.user_metadata?.avatar_url || null,
        preferred_language: 'en', // Default, could be fetched from DB
        created_at: su.created_at,
        updated_at: su.updated_at || su.created_at,
    });

    useEffect(() => {
        // 1. Get initial session
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    console.log('[AuthContext] Found Supabase session, user:', session.user.id);
                    setUser(mapSupabaseUser(session.user));
                    // Clean up dev user data if real user exists
                    localStorage.removeItem('cv_tailor_dev_user');
                    localStorage.removeItem('ai_api_keys_dev');
                    localStorage.removeItem('cv_data_d0000000-d000-d000-d000-');
                    console.log('[AuthContext] Cleaned up dev user data');
                } else {
                    console.log('[AuthContext] No Supabase session, checking for dev user');
                    const storedDevUser = localStorage.getItem('cv_tailor_dev_user');
                    if (storedDevUser) {
                        try {
                            const parsed = JSON.parse(storedDevUser);
                            // Migration: If the stored ID is not a UUID (contains 'dev-user-'), clear it
                            if (parsed.id && parsed.id.startsWith('dev-user-')) {
                                localStorage.removeItem('cv_tailor_dev_user');
                                setUser(null);
                            } else {
                                console.log('[AuthContext] Using dev user:', parsed.id);
                                setUser(parsed);
                            }
                        } catch (e) {
                            localStorage.removeItem('cv_tailor_dev_user');
                            setUser(null);
                        }
                    } else {
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('Session check failed:', error);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('[AuthContext] Auth state changed:', _event, session?.user?.id);
            if (session?.user) {
                setUser(mapSupabaseUser(session.user));
                // Clean up dev user data when real user signs in
                localStorage.removeItem('cv_tailor_dev_user');
                localStorage.removeItem('ai_api_keys_dev');
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const login = async (email: string, name: string) => {
        setLoading(true);
        try {
            // Attempt to sign in anonymously first (if enabled in Supabase)
            // But since user requested "Login stage after testing", we provide a mock fallback.

            // 1. Try Anonymous Sign In (Real Supabase Session)
            const { data, error } = await supabase.auth.signInAnonymously();

            if (!error && data.user) {
                await supabase.auth.updateUser({
                    data: { full_name: name, name: name }
                });
                toast.success(t('welcome_back', { name }));
                return;
            }

            // 2. Fallback to Local Dev User (Mock Session)
            console.warn("Falling back to local dev user since anonymous auth failed or disabled.");

            const devId = `${DEV_USER_ID_PREFIX}${Date.now().toString(16).padStart(12, '0')}`;
            const devUser: User = {
                id: devId,
                email,
                name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                preferred_language: 'en',
                google_id: null,
                avatar_url: null
            };

            // Store in localStorage to persist across refreshes
            localStorage.setItem('cv_tailor_dev_user', JSON.stringify(devUser));
            setUser(devUser);

            toast.success(t('welcome_back', { name }));
            router.push(`/${headers_locale}/dashboard`);

        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message || t('login_error'));
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        toast.info(t('logout'));
        router.push(`/${headers_locale}`);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
