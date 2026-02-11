// ═══════════════════════════════════════════════════════════════
// [F092] src/components/auth/AuthGuard.tsx
// Authentication Guard Component
// ═══════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from 'next-intl';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();
    const locale = useLocale();

    useEffect(() => {
        if (!loading) {
            if (user) {
                setIsAuthenticated(true);
            } else {
                router.push(`/${locale}`); // Redirect to login page
            }
        }
    }, [user, loading, router, locale]);

    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
            </div>
        );
    }

    return <>{children}</>;
}
