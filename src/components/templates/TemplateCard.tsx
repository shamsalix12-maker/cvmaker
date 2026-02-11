// ============================================
// [F152] src/components/templates/TemplateCard.tsx
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { Template } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, File, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
    template: Template;
    onPreview?: () => void;
    onDelete?: () => void;
    onSelect?: () => void;
    selected?: boolean;
    selectable?: boolean;
    className?: string;
}

export function TemplateCard({
    template,
    onPreview,
    onDelete,
    onSelect,
    selected = false,
    selectable = false,
    className
}: TemplateCardProps) {
    const t = useTranslations('templates');

    const typeLabels: Record<string, string> = {
        cv: t('type_cv'),
        cover_letter: t('type_cover_letter'),
        email: t('type_email')
    };

    const formatIcon = template.file_format === 'docx' ? File : FileText;
    const FormatIcon = formatIcon;

    return (
        <Card
            className={cn(
                'cursor-pointer transition-all hover:border-primary',
                selected && 'border-primary ring-2 ring-primary/20',
                className
            )}
            onClick={() => selectable && onSelect?.()}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FormatIcon className="h-4 w-4" />
                        {template.template_name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {typeLabels[template.template_type]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                        .{template.file_format}
                    </Badge>
                    <div className="flex gap-1">
                        {onPreview && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onPreview(); }}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
