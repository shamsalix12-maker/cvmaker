'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Loader2,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    BrainCircuit,
    Zap,
    ScrollText,
    Eye
} from 'lucide-react';
import { JobApplication, DraftOutput } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProcessingStepProps {
    application: JobApplication;
    isProcessing: boolean;
    onStart: () => void;
}

export function ProcessingStep({ application, isProcessing, onStart }: ProcessingStepProps) {
    const t = useTranslations('application');
    const aiT = useTranslations('ai');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isProcessing) {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) return prev;
                    return prev + Math.random() * 5;
                });
            }, 500);
            return () => clearInterval(interval);
        } else {
            setProgress(application.status === 'draft_ready' ? 100 : 0);
        }
    }, [isProcessing, application.status]);

    return (
        <div className="space-y-8 py-4">
            <div className="text-center space-y-3">
                <div className="inline-flex p-4 rounded-full bg-primary/10 mb-2 relative">
                    {isProcessing ? (
                        <BrainCircuit className="h-10 w-10 text-primary animate-pulse" />
                    ) : application.status === 'draft_ready' ? (
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                    ) : (
                        <Sparkles className="h-10 w-10 text-primary" />
                    )}
                    {isProcessing && (
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    )}
                </div>
                <h2 className="text-3xl font-black tracking-tighter">
                    {isProcessing ? t('processing') : application.status === 'draft_ready' ? t('draft_ready') : t('start_processing')}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    {isProcessing
                        ? t('ai_thinking')
                        : application.status === 'draft_ready'
                            ? "Review the generated drafts below and proceed to consolidation."
                            : "Click the button below to start the AI drafting process using your chosen models."}
                </p>
            </div>

            <div className="max-w-xl mx-auto space-y-6">
                {isProcessing && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-primary">
                            <span>{t('generating_documents')}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2 rounded-full" />
                    </div>
                )}

                {application.status === 'input' && !isProcessing && (
                    <Button
                        size="lg"
                        className="w-full rounded-2xl h-16 text-lg font-black shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all gap-3 overflow-hidden group relative"
                        onClick={onStart}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary group-hover:via-primary/90 transition-all" />
                        <Zap className="h-6 w-6 relative z-10 group-hover:rotate-12 transition-transform" />
                        <span className="relative z-10">{t('start_processing')}</span>
                    </Button>
                )}

                {application.draft_outputs.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <ScrollText className="h-4 w-4" />
                            Generated Drafts
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {application.draft_outputs.map((draft, idx) => (
                                <Dialog key={draft.id}>
                                    <DialogTrigger asChild>
                                        <Card className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group bg-card/50 backdrop-blur-sm">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                                        {draft.ai_provider}
                                                    </Badge>
                                                    <p className="text-sm font-bold truncate max-w-[150px]">
                                                        {draft.ai_model}
                                                    </p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Eye className="h-4 w-4 text-primary" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl rounded-3xl">
                                        <DialogHeader className="p-6 bg-muted/30 border-b">
                                            <DialogTitle className="flex items-center gap-3 text-xl">
                                                <Sparkles className="h-6 w-6 text-primary" />
                                                {aiT('draft_from', { model: draft.ai_model })}
                                            </DialogTitle>
                                        </DialogHeader>
                                        <ScrollArea className="flex-1 p-8">
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none text-right font-vazir leading-relaxed"
                                                dir="rtl"
                                                dangerouslySetInnerHTML={{ __html: draft.content }}
                                            />
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
