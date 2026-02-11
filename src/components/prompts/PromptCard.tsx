// ============================================
// [F122] src/components/prompts/PromptCard.tsx
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Prompt } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye, Power, PowerOff, GripVertical, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROMPT_CATEGORIES } from '@/lib/prompts/default-prompts';

interface PromptCardProps {
    prompt: Prompt;
    onEdit?: (prompt: Prompt) => void;
    onDelete?: (prompt: Prompt) => void;
    onPreview?: (prompt: Prompt) => void;
    onToggleActive?: (prompt: Prompt) => void;
    onSelect?: (prompt: Prompt) => void;
    selected?: boolean;
    selectable?: boolean;
    editable?: boolean;
    draggable?: boolean;
    className?: string;
}

export function PromptCard({
    prompt, onEdit, onDelete, onPreview, onToggleActive, onSelect,
    selected = false, selectable = false, editable = false,
    draggable = false, className
}: PromptCardProps) {
    const params = useParams();
    const locale = params.locale as 'en' | 'fa';
    const t = useTranslations('prompts');

    const title = locale === 'fa' ? prompt.title_fa : prompt.title_en;
    const description = locale === 'fa' ? prompt.description_fa : prompt.description_en;
    const categoryInfo = PROMPT_CATEGORIES.find(c => c.value === prompt.category);
    const categoryLabel = locale === 'fa' ? categoryInfo?.label_fa : categoryInfo?.label_en;

    return (
        <Card
            className={cn(
                'relative transition-all',
                selectable && 'cursor-pointer hover:border-primary',
                selected && 'border-primary ring-2 ring-primary/20',
                !prompt.is_active && 'opacity-60',
                className
            )}
            onClick={() => selectable && onSelect?.(prompt)}
        >
            {draggable && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
            )}
            {selected && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                </div>
            )}
            <CardHeader className={cn(draggable && 'pl-10')}>
                <div className="space-y-1">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="line-clamp-2">{description}</CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{categoryLabel}</Badge>
                    <Badge variant={prompt.is_active ? 'default' : 'secondary'}
                        className={cn(prompt.is_active ? 'bg-green-100 text-green-700 hover:bg-green-100' : '')}
                    >
                        {prompt.is_active ? t('active') : t('inactive')}
                    </Badge>
                </div>
            </CardHeader>

            {editable && (
                <CardContent className={cn(draggable && 'pl-10')}>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onPreview?.(prompt); }}>
                            <Eye className="h-4 w-4 mr-1" />{t('preview')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit?.(prompt); }}>
                            <Pencil className="h-4 w-4 mr-1" />{t('edit')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onToggleActive?.(prompt); }}>
                            {prompt.is_active ? <><PowerOff className="h-4 w-4 mr-1" />{t('deactivate')}</> : <><Power className="h-4 w-4 mr-1" />{t('activate')}</>}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete?.(prompt); }}>
                            <Trash2 className="h-4 w-4 mr-1" />{t('delete')}
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
