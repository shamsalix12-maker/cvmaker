// ============================================
// [F047] src/components/prompts/PromptSelector.tsx
// ============================================

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Prompt } from '@/lib/types';
import { usePrompts } from '@/hooks/usePrompts';
import { PromptList } from './PromptList';
import { PromptPreview } from './PromptPreview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptSelectorProps {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    maxSelection?: number | null;
    className?: string;
}

export function PromptSelector({
    selectedIds, onSelectionChange, maxSelection = null, className
}: PromptSelectorProps) {
    const t = useTranslations('prompts');
    const { prompts, loading } = usePrompts({ activeOnly: true });
    const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);

    const handleSelect = useCallback((prompt: Prompt) => {
        const isSelected = selectedIds.includes(prompt.id);
        if (isSelected) {
            onSelectionChange(selectedIds.filter(id => id !== prompt.id));
        } else if (maxSelection && selectedIds.length >= maxSelection) {
            onSelectionChange([...selectedIds.slice(0, -1), prompt.id]);
        } else {
            onSelectionChange([...selectedIds, prompt.id]);
        }
    }, [selectedIds, maxSelection, onSelectionChange]);

    const handleRemove = useCallback((id: string) => {
        onSelectionChange(selectedIds.filter(i => i !== id));
    }, [selectedIds, onSelectionChange]);

    const selectedPrompts = prompts.filter(p => selectedIds.includes(p.id));

    return (
        <div className={cn('space-y-4', className)}>
            {selectedPrompts.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('selected_prompts')} ({selectedPrompts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {selectedPrompts.map((prompt, index) => (
                                <Badge key={prompt.id} variant="secondary" className="px-3 py-1.5">
                                    <span className="mr-1 text-xs text-muted-foreground">{index + 1}.</span>
                                    {prompt.title_en}
                                    <button onClick={() => handleRemove(prompt.id)} className="ml-2 hover:text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>{t('available_prompts')}</CardTitle>
                    <CardDescription>
                        {maxSelection ? t('select_up_to', { count: maxSelection }) : t('select_prompts_hint')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PromptList prompts={prompts} loading={loading} selectable
                        selectedIds={selectedIds} onSelect={handleSelect} onPreview={setPreviewPrompt} />
                </CardContent>
            </Card>

            <PromptPreview prompt={previewPrompt} open={previewPrompt !== null}
                onClose={() => setPreviewPrompt(null)} />
        </div>
    );
}
