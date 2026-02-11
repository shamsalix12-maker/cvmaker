// ============================================
// [F165] src/components/settings/SettingsNav.tsx
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, User, Globe, FileText } from 'lucide-react';

export type SettingsTab = 'ai' | 'profile' | 'language' | 'templates';

interface SettingsNavProps {
    activeTab: SettingsTab;
    onTabChange: (tab: SettingsTab) => void;
}

export function SettingsNav({ activeTab, onTabChange }: SettingsNavProps) {
    const t = useTranslations('settings');

    return (
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as SettingsTab)}>
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ai" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tab_ai')}</span>
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tab_templates')}</span>
                </TabsTrigger>
                <TabsTrigger value="language" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tab_language')}</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tab_profile')}</span>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
