'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, ListChecks, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

type CVTab = 'upload' | 'fields' | 'preview';

interface CVManagerTabsProps {
    activeTab: CVTab;
    onTabChange: (tab: CVTab) => void;
    hasCV: boolean;
    completionPercentage: number;
    disabled?: boolean;
    className?: string;
}

export function CVManagerTabs({
    activeTab,
    onTabChange,
    hasCV,
    completionPercentage,
    disabled = false,
    className
}: CVManagerTabsProps) {
    const t = useTranslations('cv_manager');

    return (
        <Tabs
            value={activeTab}
            onValueChange={(v) => onTabChange(v as CVTab)}
            className={className}
        >
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                    value="upload"
                    disabled={disabled}
                    className="flex items-center gap-2"
                >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('upload_tab')}</span>
                </TabsTrigger>

                <TabsTrigger
                    value="fields"
                    disabled={disabled || !hasCV}
                    className="flex items-center gap-2"
                >
                    <ListChecks className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('fields_tab')}</span>
                    {hasCV && completionPercentage < 100 && (
                        <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full',
                            completionPercentage >= 70
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                        )}>
                            {completionPercentage}%
                        </span>
                    )}
                </TabsTrigger>

                <TabsTrigger
                    value="preview"
                    disabled={disabled || !hasCV}
                    className="flex items-center gap-2"
                >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('preview_tab')}</span>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
