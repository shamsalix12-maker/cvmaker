'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useTemplates } from '@/hooks/useTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Mail, Briefcase, Layout as LayoutIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplateSelectionStepProps {
    selectedTemplateIds: {
        cv: string | null;
        cover_letter: string | null;
        email: string | null;
    };
    onChange: (updates: any) => void;
}

export function TemplateSelectionStep({ selectedTemplateIds, onChange }: TemplateSelectionStepProps) {
    const t = useTranslations('application');
    const { templates, loading } = useTemplates();

    const sections = [
        { id: 'cv', label: t('tailored_cv'), icon: Briefcase, type: 'cv' },
        { id: 'cover_letter', label: t('cover_letter'), icon: FileText, type: 'cover_letter' },
        { id: 'email', label: t('application_email'), icon: Mail, type: 'email' },
    ];

    const selectTemplate = (sectionId: string, templateId: string | null) => {
        onChange({
            selectedTemplateIds: {
                ...selectedTemplateIds,
                [sectionId]: templateId
            }
        });
    };

    return (
        <div className="space-y-10 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">{t('select_template')}</h2>
                <p className="text-muted-foreground">{t('template_optional')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const sectionTemplates = templates.filter(t => t.template_type === section.type);
                    const selectedId = (selectedTemplateIds as any)[section.id];

                    return (
                        <div key={section.id} className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">
                                <Icon className="h-4 w-4" />
                                {section.label}
                            </div>

                            <ScrollArea className="h-[400px] border-2 rounded-3xl p-4 bg-muted/20">
                                <div className="space-y-3">
                                    {/* Default / No Template */}
                                    <Card
                                        className={cn(
                                            "cursor-pointer transition-all border-2 relative group",
                                            selectedId === null ? "border-primary bg-primary/5" : "hover:border-primary/40"
                                        )}
                                        onClick={() => selectTemplate(section.id, null)}
                                    >
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-background border-2 flex items-center justify-center">
                                                <LayoutIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm">Default Layout</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black">Standard Professional</p>
                                            </div>
                                            {selectedId === null && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                        </CardContent>
                                    </Card>

                                    {loading ? (
                                        [1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                                    ) : sectionTemplates.length === 0 ? (
                                        <div className="text-center py-10 text-[10px] text-muted-foreground uppercase font-bold opacity-50">
                                            {t('no_templates')}
                                        </div>
                                    ) : (
                                        sectionTemplates.map((template) => {
                                            const isSelected = selectedId === template.id;
                                            return (
                                                <Card
                                                    key={template.id}
                                                    className={cn(
                                                        "cursor-pointer transition-all border-2 relative group",
                                                        isSelected ? "border-primary bg-primary/5" : "hover:border-primary/40"
                                                    )}
                                                    onClick={() => selectTemplate(section.id, template.id)}
                                                >
                                                    <CardContent className="p-4 flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-background border-2 flex items-center justify-center">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-sm truncate max-w-[120px]">{template.template_name}</p>
                                                            <Badge variant="outline" className="text-[9px] uppercase">{template.file_format}</Badge>
                                                        </div>
                                                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
