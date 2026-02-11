// ============================================
// [F123] src/components/prompts/PromptPreview.tsx
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Prompt } from '@/lib/types';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PROMPT_CATEGORIES } from '@/lib/prompts/default-prompts';

interface PromptPreviewProps {
    prompt: Prompt | null;
    open: boolean;
    onClose: () => void;
}

export function PromptPreview({ prompt, open, onClose }: PromptPreviewProps) {
    const params = useParams();
    const locale = params.locale as 'en' | 'fa';
    const t = useTranslations('prompts');

    if (!prompt) return null;

    const title = locale === 'fa' ? prompt.title_fa : prompt.title_en;
    const description = locale === 'fa' ? prompt.description_fa : prompt.description_en;
    const categoryInfo = PROMPT_CATEGORIES.find(c => c.value === prompt.category);
    const categoryLabel = locale === 'fa' ? categoryInfo?.label_fa : categoryInfo?.label_en;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{categoryLabel}</Badge>
                        <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
                            {prompt.is_active ? t('active') : t('inactive')}
                        </Badge>
                    </div>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">{t('prompt_text')}</h4>
                    <ScrollArea className="h-[400px] rounded-md border p-4 bg-muted/50">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                            {prompt.prompt_text}
                        </pre>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
