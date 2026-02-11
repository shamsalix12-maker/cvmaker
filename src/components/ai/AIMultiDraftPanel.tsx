'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAIKeys } from '@/hooks/useAIKeys';
import { AIProviderName, AIModel, AISelection, DraftOutput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Zap, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    onSelectionChange: (selections: AISelection[]) => void;
    onGenerateDrafts: () => void;
    onConsolidate: () => void;
    drafts: DraftOutput[];
    isGenerating: boolean;
    isConsolidating: boolean;
    selectedAI: AISelection[];
}

export function AIMultiDraftPanel({
    onSelectionChange, onGenerateDrafts, onConsolidate,
    drafts, isGenerating, isConsolidating, selectedAI,
}: Props) {
    const t = useTranslations('ai');
    const { keys } = useAIKeys();
    const allModels = useMemo(() => keys.flatMap(k => k.available_models.map(m => ({ ...m, provider: k.provider_name }))), [keys]);
    const draftSels = selectedAI.filter(s => s.role === 'draft');
    const finalSel = selectedAI.find(s => s.role === 'final');

    const toggleModel = (m: AIModel) => {
        const isSel = draftSels.some(s => s.model_id === m.model_id);
        const next = isSel ? selectedAI.filter(s => !(s.role === 'draft' && s.model_id === m.model_id))
            : [...selectedAI, { provider: m.provider, model_id: m.model_id, role: 'draft' as const }];
        onSelectionChange(next);
    };

    const setFinal = (v: string) => {
        const [p, id] = v.split(':');
        onSelectionChange([...selectedAI.filter(s => s.role !== 'final'), { provider: p as AIProviderName, model_id: id, role: 'final' }]);
    };

    return (
        <div className="space-y-6">
            <Card className="border-2 border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl font-black">
                        <Zap className="h-6 w-6 text-primary animate-pulse" /> {t('multi_draft_title')}
                    </CardTitle>
                    <CardDescription>{t('multi_draft_description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold">{t('draft_providers')}</h3>
                            <Badge variant="secondary">{t('models_selected', { count: draftSels.length })}</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {allModels.map(m => (
                                <Button key={m.model_id} variant={draftSels.some(s => s.model_id === m.model_id) ? "default" : "outline"}
                                    className="h-auto py-3 flex flex-col items-start gap-0.5 hover:scale-[1.01] transition-transform"
                                    onClick={() => toggleModel(m)} disabled={isGenerating || isConsolidating}>
                                    <div className="flex justify-between w-full items-center">
                                        <span className="font-bold text-sm">{m.model_name}</span>
                                        <Badge className="text-[9px] uppercase">{m.provider}</Badge>
                                    </div>
                                    <span className="text-[10px] opacity-60 font-mono">{m.model_id}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 border-t space-y-3">
                        <h3 className="font-bold">{t('final_provider')}</h3>
                        <Select disabled={isGenerating || isConsolidating} onValueChange={setFinal}
                            value={finalSel ? `${finalSel.provider}:${finalSel.model_id}` : undefined}>
                            <SelectTrigger className="h-11"><SelectValue placeholder={t('select_final_model')} /></SelectTrigger>
                            <SelectContent>{allModels.map(m => (
                                <SelectItem key={m.model_id} value={`${m.provider}:${m.model_id}`}>
                                    {m.model_name} <Badge variant="outline" className="ml-2 text-[9px]">{m.provider}</Badge>
                                </SelectItem>
                            ))}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 bg-muted/20 p-4 rounded-b-xl border-t">
                    <Button onClick={onGenerateDrafts} disabled={isGenerating || isConsolidating || draftSels.length === 0} className="flex-1 h-11 font-bold">
                        {isGenerating ? <Loader2 className="mr-2 animate-spin h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />} {t('generate_drafts')}
                    </Button>
                    <Button variant="secondary" onClick={onConsolidate} disabled={isGenerating || isConsolidating || drafts.length === 0 || !finalSel} className="flex-1 h-11 font-bold">
                        {isConsolidating ? <Loader2 className="mr-2 animate-spin h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />} {t('consolidate_drafts')}
                    </Button>
                </CardFooter>
            </Card>

            {drafts.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-black flex items-center gap-2"><CheckCircle2 className="text-green-500 w-5 h-5" /> {t('draft_ready')}</h3>
                    <Tabs defaultValue={drafts[0].id}>
                        <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-1">
                            {drafts.map(d => <TabsTrigger key={d.id} value={d.id} className="flex-1 py-1.5 text-xs font-bold">{d.ai_model}</TabsTrigger>)}
                        </TabsList>
                        {drafts.map(d => (
                            <TabsContent key={d.id} value={d.id}>
                                <Card className="bg-card shadow-sm"><CardHeader className="bg-muted/10 py-3 border-b">
                                    <CardTitle className="text-sm font-bold flex justify-between items-center">
                                        {t('draft_from', { model: d.ai_model })}<Badge variant="outline" className="text-[9px]">{d.ai_provider}</Badge>
                                    </CardTitle></CardHeader>
                                    <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{d.content}</CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            ) : !isGenerating && (
                <div className="flex flex-col items-center p-8 border-2 border-dashed rounded-xl opacity-50"><AlertCircle className="mb-2" /><p className="text-sm">{t('no_drafts_yet')}</p></div>
            )}
        </div>
    );
}
