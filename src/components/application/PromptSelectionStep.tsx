'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePrompts } from '@/hooks/usePrompts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PromptSelectionStepProps {
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}

export function PromptSelectionStep({ selectedIds, onChange }: PromptSelectionStepProps) {
    const t = useTranslations('application');
    const promptsT = useTranslations('prompts');
    const locale = useLocale();
    const { prompts, loading, categories } = usePrompts({ activeOnly: true });
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPrompts = prompts.filter(p => {
        const title = locale === 'fa' ? p.title_fa : p.title_en;
        const desc = locale === 'fa' ? p.description_fa : p.description_en;
        return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            desc.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const toggleId = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(i => i !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('select_prompts')}</h2>
                    <p className="text-muted-foreground">{t('select_prompts_help')}</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search prompts..."
                        className="pl-9 rounded-xl focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="h-[500px] pr-4">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">
                        <Info className="h-10 w-10 mb-4 opacity-20" />
                        <p>{t('no_prompts_selected')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                        {filteredPrompts.map((prompt) => {
                            const isSelected = selectedIds.includes(prompt.id);
                            return (
                                <Card
                                    key={prompt.id}
                                    className={cn(
                                        "cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group",
                                        isSelected
                                            ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                                            : "hover:border-primary/40 hover:bg-muted/50"
                                    )}
                                    onClick={() => toggleId(prompt.id)}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 z-10">
                                            <CheckCircle2 className="h-5 w-5 text-primary fill-background" />
                                        </div>
                                    )}
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-tighter bg-background">
                                                {prompt.category}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base font-bold line-clamp-1">
                                            {locale === 'fa' ? prompt.title_fa : prompt.title_en}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {locale === 'fa' ? prompt.description_fa : prompt.description_en}
                                        </p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
