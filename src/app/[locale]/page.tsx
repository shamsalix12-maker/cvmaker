"use client";

import { useAuth } from "@/context/AuthContext";
import { DevLoginForm } from "@/components/auth/DevLoginForm";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function Home() {
    const { user, loading } = useAuth();
    const t = useTranslations('auth');
    const router = useRouter();
    const locale = useLocale();

    useEffect(() => {
        if (!loading && user) {
            router.push(`/${locale}/dashboard`);
        }
    }, [user, loading, router, locale]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/20">
            <div className="z-10 w-full max-w-sm space-y-6">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-black tracking-tighter">CV Tailor</h1>
                    <p className="text-muted-foreground">{t('login_subtitle')}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6">
                    <GoogleLoginButton />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                {t('or')}
                            </span>
                        </div>
                    </div>

                    <DevLoginForm />
                </div>
            </div>
        </main>
    );
}
