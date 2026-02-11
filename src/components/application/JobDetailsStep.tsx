'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Briefcase, Building2, AlignLeft } from 'lucide-react';

interface JobDetailsStepProps {
    data: {
        job_title: string;
        company_name: string;
        job_description: string;
    };
    onChange: (updates: any) => void;
}

export function JobDetailsStep({ data, onChange }: JobDetailsStepProps) {
    const t = useTranslations('application');

    return (
        <div className="space-y-8 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        {t('job_title')}
                    </Label>
                    <Input
                        placeholder="e.g. Senior Frontend Developer"
                        value={data.job_title}
                        onChange={(e) => onChange({ job_title: e.target.value })}
                        className="h-14 rounded-2xl border-2 focus-visible:ring-primary/20 bg-background/50 backdrop-blur-sm text-lg"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {t('company_name')}
                    </Label>
                    <Input
                        placeholder="e.g. Google"
                        value={data.company_name}
                        onChange={(e) => onChange({ company_name: e.target.value })}
                        className="h-14 rounded-2xl border-2 focus-visible:ring-primary/20 bg-background/50 backdrop-blur-sm text-lg"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <AlignLeft className="h-3 w-3" />
                    {t('job_description')}
                </Label>
                <Textarea
                    placeholder={t('enter_job_description')}
                    value={data.job_description}
                    onChange={(e) => onChange({ job_description: e.target.value })}
                    className="min-h-[300px] rounded-3xl border-2 focus-visible:ring-primary/20 bg-background/50 backdrop-blur-sm p-6 text-base leading-relaxed resize-none"
                />
                <p className="text-[10px] text-muted-foreground italic px-2">
                    {t('job_description_help')}
                </p>
            </div>
        </div>
    );
}
