// ============================================
// [F061] src/components/templates/TemplateSelector.tsx
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { useTemplates } from '@/hooks/useTemplates';
import { Template, TemplateType } from '@/lib/types';
import { TemplateCard } from './TemplateCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';

interface TemplateSelectorProps {
    type: TemplateType;
    selectedId: string | null;
    onSelect: (template: Template | null) => void;
    className?: string;
}

export function TemplateSelector({
    type,
    selectedId,
    onSelect,
    className
}: TemplateSelectorProps) {
    const t = useTranslations('templates');
    const { templates, loading } = useTemplates(type);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('select_template')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {t('no_templates_for_type')}
                    </p>
                ) : (
                    <div className="grid gap-3">
                        {/* Default option */}
                        <div
                            className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-primary ${!selectedId ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => onSelect(null)}
                        >
                            <p className="font-medium">{t('use_default')}</p>
                            <p className="text-sm text-muted-foreground">{t('use_default_hint')}</p>
                        </div>

                        {templates.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                selected={selectedId === template.id}
                                selectable
                                onSelect={() => onSelect(template)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
