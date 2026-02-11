'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
    Languages,
    MessageSquare,
    CheckCircle2,
    Zap,
    Mic2,
    Smile,
    Briefcase,
    ShieldCheck,
    PenTool
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OutputLanguage, ToneSetting, TonePreset } from '@/lib/types';

interface LanguageToneStepProps {
    language: OutputLanguage;
    tone: ToneSetting;
    onChange: (updates: { language?: OutputLanguage; tone?: ToneSetting }) => void;
}

const TONE_PRESETS: { id: TonePreset; icon: any; label: string }[] = [
    { id: 'formal', icon: Briefcase, label: 'Formal' },
    { id: 'professional', icon: ShieldCheck, label: 'Professional' },
    { id: 'semi-formal', icon: Mic2, label: 'Semi-Formal' },
    { id: 'friendly', icon: Smile, label: 'Friendly' },
    { id: 'creative', icon: Zap, label: 'Creative' },
    { id: 'confident', icon: CheckCircle2, label: 'Confident' },
];

export function LanguageToneStep({ language, tone, onChange }: LanguageToneStepProps) {
    const t = useTranslations('application');

    const handleToneModeChange = (mode: 'preset' | 'custom') => {
        onChange({ tone: { ...tone, mode } });
    };

    const handlePresetChange = (preset: TonePreset) => {
        onChange({ tone: { ...tone, preset_value: preset, mode: 'preset' } });
    };

    return (
        <div className="space-y-10 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Language Selection */}
            <div className="space-y-4">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    {t('select_language')}
                </Label>
                <div className="max-w-xs">
                    <Select value={language} onValueChange={(val: any) => onChange({ language: val })}>
                        <SelectTrigger className="h-14 rounded-2xl border-2 bg-background/50 backdrop-blur-sm px-4">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-xl">
                            <SelectItem value="en">English (US)</SelectItem>
                            <SelectItem value="fa">Persian (فارسی)</SelectItem>
                            <SelectItem value="de">German (Deutsch)</SelectItem>
                            <SelectItem value="fr">French (Français)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <p className="text-[10px] text-muted-foreground italic px-2">
                    {t('select_language_help')}
                </p>
            </div>

            {/* Tone Selection */}
            <div className="space-y-6">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t('select_tone')}
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Preset Section */}
                    <Card
                        className={cn(
                            "p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                            tone.mode === 'preset' ? "border-primary bg-primary/5 shadow-lg" : "hover:border-primary/40"
                        )}
                        onClick={() => handleToneModeChange('preset')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-bold">{t('tone_preset')}</span>
                            <div className={cn(
                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                tone.mode === 'preset' ? "border-primary bg-primary" : "border-muted-foreground"
                            )}>
                                {tone.mode === 'preset' && <div className="h-2 w-2 rounded-full bg-background" />}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {TONE_PRESETS.map((p) => {
                                const Icon = p.icon;
                                const isSelected = tone.mode === 'preset' && tone.preset_value === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePresetChange(p.id);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border-2",
                                            isSelected
                                                ? "bg-background border-primary text-primary shadow-sm"
                                                : "bg-muted/30 border-transparent hover:bg-background hover:border-muted text-muted-foreground"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground/50")} />
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Custom Section */}
                    <Card
                        className={cn(
                            "p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between",
                            tone.mode === 'custom' ? "border-primary bg-primary/5 shadow-lg" : "hover:border-primary/40"
                        )}
                        onClick={() => handleToneModeChange('custom')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <PenTool className="h-4 w-4 text-primary" />
                                <span className="font-bold">{t('tone_custom')}</span>
                            </div>
                            <div className={cn(
                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                tone.mode === 'custom' ? "border-primary bg-primary" : "border-muted-foreground"
                            )}>
                                {tone.mode === 'custom' && <div className="h-2 w-2 rounded-full bg-background" />}
                            </div>
                        </div>
                        <Textarea
                            placeholder={t('custom_tone_placeholder')}
                            value={tone.custom_text || ''}
                            onChange={(e) => onChange({ tone: { ...tone, custom_text: e.target.value, mode: 'custom' } })}
                            onFocus={() => handleToneModeChange('custom')}
                            className="min-h-[120px] rounded-2xl border-2 bg-background/50 focus-visible:ring-primary/20 p-4"
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
}
