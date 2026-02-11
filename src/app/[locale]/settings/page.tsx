// ============================================
// [F016] src/app/[locale]/settings/page.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SettingsNav, SettingsTab } from '@/components/settings/SettingsNav';
import { AIKeyManager } from '@/components/ai/AIKeyManager';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { TemplateSettings } from '@/components/settings/TemplateSettings';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function SettingsPage() {
    const t = useTranslations('settings');
    const [activeTab, setActiveTab] = useState<SettingsTab>('ai');

    return (
        <AuthGuard>
            <div className="container mx-auto py-8 px-4 max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('page_subtitle')}
                    </p>
                </div>

                <SettingsNav
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="mt-8">
                    {activeTab === 'ai' && <AIKeyManager />}
                    {activeTab === 'templates' && <TemplateSettings />}
                    {activeTab === 'language' && <LanguageSettings />}
                    {activeTab === 'profile' && <ProfileSettings />}
                </div>
            </div>
        </AuthGuard>
    );
}
