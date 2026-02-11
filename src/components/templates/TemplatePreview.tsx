// ============================================
// [F062] src/components/templates/TemplatePreview.tsx
// ============================================

'use client';

import { useTranslations } from 'next-intl';
import { Template } from '@/lib/types';
import { extractPlaceholders } from '@/lib/templates';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplatePreviewProps {
    template: Template | null;
    open: boolean;
    onClose: () => void;
}

export function TemplatePreview({ template, open, onClose }: TemplatePreviewProps) {
    const t = useTranslations('templates');

    if (!template) return null;

    const placeholders = extractPlaceholders(template.file_content);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>{template.template_name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Badge>{template.template_type}</Badge>
                        <Badge variant="outline">.{template.file_format}</Badge>
                    </div>

                    {placeholders.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">{t('placeholders')}:</p>
                            <div className="flex flex-wrap gap-1">
                                {placeholders.map((p) => (
                                    <Badge key={p} variant="secondary" className="text-xs">
                                        {p}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <ScrollArea className="h-[400px] border rounded-md p-4 bg-muted/30">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                            {template.file_content}
                        </pre>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
