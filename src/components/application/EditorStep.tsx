'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { OutputEditor } from './OutputEditor';
import { JobApplication, FinalOutput } from '@/lib/types';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Mail, Briefcase, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface EditorStepProps {
    application: JobApplication;
    onSave: (output: FinalOutput) => void;
    onApprove: () => void;
}

export function EditorStep({ application, onSave, onApprove }: EditorStepProps) {
    const t = useTranslations('application');
    const editorT = useTranslations('editor');

    // Local state for current edits
    const [currentOutput, setCurrentOutput] = useState<FinalOutput>(
        application.edited_output || application.final_output || {
            tailored_cv: '',
            cover_letter: '',
            application_email: ''
        }
    );

    const handleFieldChange = (field: keyof FinalOutput, content: string) => {
        const newOutput = { ...currentOutput, [field]: content };
        setCurrentOutput(newOutput);
        onSave(newOutput);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{editorT('title')}</h2>
                    <p className="text-muted-foreground">{editorT('description')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl h-12 px-6 gap-2"
                        onClick={() => {
                            onSave(currentOutput);
                            toast.success(editorT('content_saved'));
                        }}
                    >
                        <Save className="h-4 w-4" />
                        {editorT('undo').replace('Undo', 'Save Draft')}
                    </Button>
                    <Button
                        className="rounded-xl h-12 px-6 gap-2 shadow-lg shadow-primary/20"
                        onClick={onApprove}
                    >
                        <Check className="h-4 w-4" />
                        {editorT('approve')}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="cv" className="w-full">
                <TabsList className="grid grid-cols-3 h-14 bg-muted/50 p-1 rounded-2xl border mb-6 max-w-2xl mx-auto">
                    <TabsTrigger value="cv" className="rounded-xl flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                        <Briefcase className="h-4 w-4" />
                        {t('tailored_cv')}
                    </TabsTrigger>
                    <TabsTrigger value="cover_letter" className="rounded-xl flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                        <FileText className="h-4 w-4" />
                        {t('cover_letter')}
                    </TabsTrigger>
                    <TabsTrigger value="email" className="rounded-xl flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                        <Mail className="h-4 w-4" />
                        {t('application_email')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="cv">
                    <OutputEditor
                        initialContent={currentOutput.tailored_cv}
                        onSave={(content) => handleFieldChange('tailored_cv', content)}
                        onApprove={onApprove}
                        title={t('tailored_cv')}
                    />
                </TabsContent>

                <TabsContent value="cover_letter">
                    <OutputEditor
                        initialContent={currentOutput.cover_letter}
                        onSave={(content) => handleFieldChange('cover_letter', content)}
                        onApprove={onApprove}
                        title={t('cover_letter')}
                    />
                </TabsContent>

                <TabsContent value="email">
                    <OutputEditor
                        initialContent={currentOutput.application_email}
                        onSave={(content) => handleFieldChange('application_email', content)}
                        onApprove={onApprove}
                        title={t('application_email')}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
