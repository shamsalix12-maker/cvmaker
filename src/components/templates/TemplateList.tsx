// ============================================
// [F151] src/components/templates/TemplateList.tsx
// ============================================

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Template } from '@/lib/types';
import { TemplateCard } from './TemplateCard';
import { TemplatePreview } from './TemplatePreview';
import { Loader2 } from 'lucide-react';

interface TemplateListProps {
    templates: Template[];
    loading?: boolean;
    onDelete?: (template: Template) => void;
    className?: string;
}

export function TemplateList({
    templates,
    loading = false,
    onDelete,
    className
}: TemplateListProps) {
    const t = useTranslations('templates');
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (templates.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                {t('no_templates')}
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        onPreview={() => setPreviewTemplate(template)}
                        onDelete={() => onDelete?.(template)}
                    />
                ))}
            </div>

            <TemplatePreview
                template={previewTemplate}
                open={previewTemplate !== null}
                onClose={() => setPreviewTemplate(null)}
            />
        </>
    );
}
